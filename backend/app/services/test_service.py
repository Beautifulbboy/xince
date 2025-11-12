from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, desc
from typing import Optional, Union, List  # [修改] 导入 Union

# 导入数据库模型
from app.models.models import TestSession,Test, Question, QuestionOption, TestResult
# 导入 Pydantic schemas
from app.schemas import schemas


async def create_test(db: AsyncSession, test: schemas.TestCreate) -> Test:
    """
    创建一个完整的测试（包含问题、选项和结果范围）
    (此函数保持不变)
    """
    
    # 1. 创建 Test 对象
    db_test = Test(
        test_type=test.test_type,
        title=test.title,
        description=test.description
    )

    # 2. 遍历 Pydantic schema 中的 questions 并创建 Question 和 QuestionOption 模型
    for q_in in test.questions:
        db_question = Question(
            text=q_in.text,
            order_index=q_in.order_index
        )
        
        # 3. 遍历 q_in.options 创建选项
        for opt_in in q_in.options:
            db_option = QuestionOption(
                text=opt_in.text,
                score=opt_in.score
            )
            db_question.options.append(db_option) # 附加到 Question
        
        db_test.questions.append(db_question) # 附加到 Test

    # 4. 遍历 Pydantic schema 中的 results 并创建 TestResult 模型
    for res_in in test.results:
        db_result = TestResult(
            min_score=res_in.min_score,
            max_score=res_in.max_score,
            result_range=res_in.result_range,
            description=res_in.description
        )
        db_test.results.append(db_result) # 附加到 Test

    # 5. 一次性将 Test (及其所有级联的子对象) 添加到 session
    db.add(db_test)
    
    # 7. 刷新 db_test 以获取新 ID 和关系
    await db.flush() # flush 以获取 ID
    await db.refresh(db_test)
    
    # 刷新嵌套的关系，以便在响应中返回它们
    await db.refresh(db_test, attribute_names=["questions", "results"])
    
    return db_test


async def get_test_by_type(
    db: AsyncSession, 
    test_type: str,
    include_scores: bool = False  # [修改] 1. 添加 'include_scores' 参数
) -> Optional[Union[schemas.TestForTaking, Test]]: # [修改] 2. 更改返回类型
    """
    获取测试。
    如果 include_scores=True, 返回包含分数的完整 Test 数据库模型。
    否则, 返回剥离分数的 TestForTaking schema。
    """
    
    # 基础查询，总是加载问题和选项
    query_options = [
        selectinload(Test.questions)
        .selectinload(Question.options)
    ]
    
    # [修改] 3. 如果需要分数，我们才预加载 'results'
    if include_scores:
        query_options.append(selectinload(Test.results))

    # 执行查询
    stmt = (
        select(Test)
        .where(Test.test_type == test_type)
        .options(*query_options) # 使用解包操作符应用所有 options
    )
    
    result = await db.execute(stmt)
    db_test = result.scalars().first()

    if not db_test:
        return None
    
    # 确保问题按 order_index 排序
    db_test.questions = sorted(db_test.questions, key=lambda q: q.order_index)

    # [修改] 4. 核心逻辑分支
    if include_scores:
        # 返回完整的数据库模型。
        # FastAPI 会使用 'schemas.Test' (在 endpoints.py 中定义)
        # 配合 orm_mode=True 自动将其序列化
        return db_test
    else:
        # 返回“安全”的版本，剥离分数 (原始逻辑)
        questions_for_taking = []
        for q in db_test.questions:
            # 剥离分数：只选择 id 和 text
            options_stripped = [{"id": opt.id, "text": opt.text} for opt in q.options]
            
            questions_for_taking.append(
                schemas.QuestionForTaking(
                    id=q.id,
                    text=q.text,
                    order_index=q.order_index,
                    options=options_stripped
                )
            )

        # 构造并返回最终的 TestForTaking 对象
        return schemas.TestForTaking(
            id=db_test.id,
            test_type=db_test.test_type,
            title=db_test.title,
            description=db_test.description,
            questions=questions_for_taking
        )
    
async def get_popular_tests(db: AsyncSession, limit: int = 6) -> List[schemas.PopularTest]:
    """
    获取测试次数最多的 N 个测试
    """
    
    # 1. 创建一个子查询 (Subquery)
    #    作用: 统计 test_sessions 表中每个 test_id 出现了多少次
    session_counts_sq = (
        select(
            TestSession.test_id,
            func.count(TestSession.id).label("session_count") # COUNT(id) AS session_count
        )
        .group_by(TestSession.test_id) # GROUP BY test_id
        .subquery() # 转换成子查询
    )

    # 2. 创建主查询
    #    作用: JOIN tests 表 和 上一步的统计结果
    stmt = (
        select(
            Test.id,
            Test.test_type,
            Test.title,
            Test.description,
            session_counts_sq.c.session_count # 'c' 代表 'columns'
        )
        .join(
            session_counts_sq, Test.id == session_counts_sq.c.test_id # JOIN ON tests.id = ...
        )
        .order_by(desc(session_counts_sq.c.session_count)) # ORDER BY ... DESC
        .limit(limit) # LIMIT 6
    )
    
    result = await db.execute(stmt)
    
    # 3. 将查询结果 (SQLAlchemy Rows) 转换为 Pydantic 模型
    popular_tests = [
        schemas.PopularTest(
            id=row.id,
            test_type=row.test_type,
            title=row.title,
            description=row.description,
            session_count=row.session_count
        ) for row in result.all() # .all() 是安全的，因为我们 limit 了 6 个
    ]
    
    return popular_tests