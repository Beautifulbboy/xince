from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from typing import Dict, List, Tuple

# 导入数据库模型
from app.models.models import Test, TestSession, UserAnswer, QuestionOption, TestResult
# 导入 Pydantic schemas
from app.schemas import schemas

# ---------------------------------------------------------------
# [新增] 辅助函数 1: 你的新 MBTI 计分逻辑
# ---------------------------------------------------------------
async def _calculate_mbti_score(
    options_from_db: List[QuestionOption]
) -> Tuple[int, str]:
    """
    根据用户的答案计算 MBTI 4字母类型 和 唯一的数字分数。
    返回 (total_score, type_code) e.g. (2111, "ISTJ")
    """
    
    # 步骤 1：按维度统计
    # 维度映射 (score_id -> 字母)
    trait_map = {1: 'E', 2: 'I', 3: 'N', 4: 'S', 5: 'F', 6: 'T', 7: 'J', 8: 'P'}
    
    # 维度计数器
    counts = {
        'EI': {'E': 0, 'I': 0}, # 题 1-7
        'SN': {'S': 0, 'N': 0}, # 题 8-14
        'TF': {'T': 0, 'F': 0}, # 题 15-21
        'JP': {'J': 0, 'P': 0}  # 题 22-28
    }

    for opt in options_from_db:
        if not opt.question:
            raise HTTPException(status_code=500, detail=f"数据错误: 选项 {opt.id} 没有关联的问题")

        order_idx = opt.question.order_index
        trait_id = opt.score # 1-8
        
        trait_letter = trait_map.get(trait_id)
        if not trait_letter:
            continue # 忽略无效的 score_id

        if 1 <= order_idx <= 7 and trait_letter in counts['EI']:
            counts['EI'][trait_letter] += 1
        elif 8 <= order_idx <= 14 and trait_letter in counts['SN']:
            counts['SN'][trait_letter] += 1
        elif 15 <= order_idx <= 21 and trait_letter in counts['TF']:
            counts['TF'][trait_letter] += 1
        elif 22 <= order_idx <= 28 and trait_letter in counts['JP']:
            counts['JP'][trait_letter] += 1

    # 确定最终类型
    type_code = ""
    type_code += "I" if counts['EI']['I'] > counts['EI']['E'] else "E"
    type_code += "N" if counts['SN']['N'] > counts['SN']['S'] else "S"
    type_code += "T" if counts['TF']['T'] > counts['TF']['F'] else "F"
    type_code += "J" if counts['JP']['J'] > counts['JP']['P'] else "P"

    # 步骤 2：将四字母类型转换为唯一的数字总分
    score_encoding = {
        'E': 1000, 'I': 2000,
        'S': 100,  'N': 200,
        'T': 10,   'F': 20,
        'J': 1,    'P': 2
    }

    total_score = (
        score_encoding[type_code[0]] +
        score_encoding[type_code[1]] +
        score_encoding[type_code[2]] +
        score_encoding[type_code[3]]
    )

    # 步骤 3：返回唯一分数和类型代码
    return total_score, type_code

# ---------------------------------------------------------------
# [新增] 辅助函数 2: 原始的加总计分逻辑
# ---------------------------------------------------------------
async def _calculate_sum_score(
    options_from_db: List[QuestionOption]
) -> int:
    """
    计算所有选项分数的总和。
    """
    total_score = 0
    for opt in options_from_db:
        total_score += opt.score
    return total_score


# ---------------------------------------------------------------
# [修改] 核心函数：calculate_and_save_session
# ---------------------------------------------------------------
async def calculate_and_save_session(
    db: AsyncSession, 
    test_id: int, 
    submission: schemas.TestSubmission
) -> TestSession:
    """
    核心逻辑：
    1. 检查测试类型 (test_type)
    2. 根据类型分发到不同的计分函数
    3. 根据计分结果查询 TestResult
    4. 保存 Session 和 Answers
    """
    
    # --- 1. [新] 获取 Test 类型 ---
    test_stmt = select(Test).where(Test.id == test_id)
    test_result = await db.execute(test_stmt)
    db_test = test_result.scalars().first()
    
    if not db_test:
        raise HTTPException(status_code=404, detail="Test not found")

    # --- 2. [通用] 准备数据 ---
    
    # 提取所有提交的 option ID
    selected_option_ids = [ans.selected_option_id for ans in submission.answers]
    if not selected_option_ids:
        raise HTTPException(status_code=400, detail="No answers submitted")

    # [通用] 准备要创建的 UserAnswer 数据库对象
    db_answers_to_create = [
        UserAnswer(
            question_id=ans.question_id,
            selected_option_id=ans.selected_option_id
        ) for ans in submission.answers
    ]
    
    # [通用] 一次性从数据库查询所有这些 option
    # [重要] 我们使用 selectinload 预加载 Question 及其 order_index
    # 这样 MBTI 逻辑才能工作
    stmt_scores = (
        select(QuestionOption)
        .where(QuestionOption.id.in_(selected_option_ids))
        .options(selectinload(QuestionOption.question)) # 预加载问题信息
    )
    result_scores = await db.execute(stmt_scores)
    options_from_db = result_scores.scalars().all()

    # 验证是否所有提交的 ID 都有效
    if len(options_from_db) != len(set(selected_option_ids)):
        raise HTTPException(status_code=400, detail="One or more selected options are invalid.")

    # --- 3. [修改] 计分逻辑分发 ---
    
    total_score = 0
    result_text = "未定义的结果"
    stmt_result = None # 用于查询 TestResult 的语句
    
    # [关键] 检查 test_type 并选择计分策略
    # 你需要确保你的 MBTI 测试在创建时 test_type 设置为 "mbti"
    if db_test.test_type == "mbti":
        # 调用 MBTI 计分逻辑
        total_score, type_code = await _calculate_mbti_score(options_from_db)
        
        # MBTI 的结果查询是精确匹配
        stmt_result = select(TestResult).where(
            TestResult.test_id == test_id,
            TestResult.min_score == total_score
        )
        # 默认 result_text 是类型代码, e.g., "ISTJ"
        # 稍后会被数据库中的 result_range (e.g., "学者型") 覆盖
        result_text = type_code 
        
    else:
        # 默认使用“加总”逻辑 (e.g., "phq-9")
        total_score = await _calculate_sum_score(options_from_db)
        
        # “加总”的结果查询是范围匹配
        stmt_result = select(TestResult).where(
            TestResult.test_id == test_id,
            TestResult.min_score <= total_score,
            (TestResult.max_score >= total_score) | (TestResult.max_score.is_(None))
        )
        result_text = "未定义的结果范围"

    # --- 4. [通用] 匹配结果 ---
    
    final_result_model = None
    if stmt_result is not None:
        result_obj = await db.execute(stmt_result)
        final_result_model = result_obj.scalars().first()

    if final_result_model:
        # [重要] 
        # PHQ-9 会得到: "轻度抑郁"
        # MBTI 会得到: "ISTJ" (或者你定义的 "学者型 - ISTJ")
        result_text = final_result_model.result_range
        # 你也可以选择返回 description:
        # result_text = final_result_model.description 
        
    # --- 5. [通用] 保存 Session 和 Answers ---

    db_session = TestSession(
        user_id=submission.user_id,
        test_id=test_id,
        result=result_text, # 存储 "ISTJ" 或 "轻度抑郁"
        total_score=total_score # 存储 2111 或 15
    )
    
    # 关联所有 UserAnswer 对象
    db_session.answers = db_answers_to_create

    db.add(db_session)
    
    # --- 6. [通用] 返回完整的 Session 结果 ---
    await db.flush()
    await db.refresh(db_session)
    await db.refresh(db_session, attribute_names=["answers"])

    return db_session