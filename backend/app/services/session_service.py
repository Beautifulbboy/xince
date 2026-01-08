from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from typing import Dict, List, Tuple, Any

# 导入数据库模型
from app.models.models import (
    Test, TestSession, UserAnswer, QuestionOption, 
    TestResult, TestSessionDimension
)
# 导入 Pydantic schemas
from app.schemas import schemas

# ---------------------------------------------------------------
# [新增] HPLP 量表的计分“地图”
# 键: 题号 (order_index), 值: 维度代码 (dimension_code)
# ---------------------------------------------------------------
HPLP_DIMENSION_MAP: Dict[int, str] = {
    1: "HR", 6: "HR", 12: "HR", 14: "HR", 19: "HR", 24: "HR", 28: "HR", 32: "HR", 35: "HR", 38: "HR", 40: "HR", # 健康责任
    2: "PA", 8: "PA", 15: "PA", 21: "PA", 26: "PA", 31: "PA", 37: "PA", 39: "PA", # 体育活动
    3: "N", 9: "N", 16: "N", 22: "N", 27: "N", 34: "N", # 营养
    4: "IR", 10: "IR", 17: "IR", 23: "IR", 30: "IR", # 人际关系
    5: "SM", 11: "SM", 18: "SM", 25: "SM", 33: "SM", # 压力管理
    7: "SG", 13: "SG", 20: "SG", 29: "SG", 36: "SG"  # 精神成长
}

# ---------------------------------------------------------------
# [计分地图] MPS 多维完美主义问卷
# ---------------------------------------------------------------
MPS_DIMENSION_MAP: Dict[int, List[str]] = {
    # SOP: 自我完美主义 (也属于 HST)
    2: ["SOP", "HST"], 4: ["SOP", "HST"], 14: ["SOP", "HST"], 15: ["SOP", "HST"], 26: ["SOP", "HST"],
    # OOP: 他人完美主义 (也属于 HST)
    10: ["OOP", "HST"], 11: ["OOP", "HST"], 12: ["OOP", "HST"], 19: ["OOP", "HST"], 24: ["OOP", "HST"],
    # SPP: 社会完美主义 (也属于 HST)
    1: ["SPP", "HST"], 6: ["SPP", "HST"], 21: ["SPP", "HST"], 25: ["SPP", "HST"], 29: ["SPP", "HST"],
    # EMO: 情绪 (也属于 ADT)
    3: ["EMO", "ADT"], 5: ["EMO", "ADT"], 7: ["EMO", "ADT"], 9: ["EMO", "ADT"], 13: ["EMO", "ADT"], 
    17: ["EMO", "ADT"], 22: ["EMO", "ADT"], 23: ["EMO", "ADT"], 28: ["EMO", "ADT"],
    # CB: 认知行为 (也属于 ADT)
    8: ["CB", "ADT"], 16: ["CB", "ADT"], 18: ["CB", "ADT"], 20: ["CB", "ADT"], 27: ["CB", "ADT"]
}

# ---------------------------------------------------------------
# [新增] MPS 专属计分函数
# ---------------------------------------------------------------
async def _calculate_mps_results(
    db: AsyncSession, 
    test_id: int,
    options_from_db: List[QuestionOption]
) -> Tuple[int, str, List[TestSessionDimension]]:
    """
    专门为“多维完美主义问卷”(MPS) 计分。
    包含 5 个基础维度和 2 个汇总分量表（HST, ADT）。
    """
    # 1. 初始化分数 (7个维度代码)
    dim_scores: Dict[str, int] = {
        "SOP": 0, "OOP": 0, "SPP": 0, "EMO": 0, "CB": 0, "HST": 0, "ADT": 0
    }
    total_score = 0
    
    # 2. 累加计分
    for opt in options_from_db:
        q_index = opt.question.order_index
        score = opt.score
        total_score += score
        
        # 一个题目可能对应多个维度代码（如 2号题既是 SOP 也是 HST）
        target_codes = MPS_DIMENSION_MAP.get(q_index, [])
        for code in target_codes:
            dim_scores[code] += score
            
    # 3. 加载规则并匹配 (逻辑与 HPLP 一致)
    stmt_rules = select(TestResult).where(
        TestResult.test_id == test_id,
        TestResult.dimension_code.isnot(None)
    )
    result_rules = await db.execute(stmt_rules)
    dimension_rules = result_rules.scalars().all()

    dimensions_to_create: List[TestSessionDimension] = []
    
    for dim_code, score in dim_scores.items():
        found_rule_text = f"分数: {score}"
        for rule in dimension_rules:
            if rule.dimension_code == dim_code:
                if (rule.min_score <= score and (rule.max_score is None or rule.max_score >= score)):
                    found_rule_text = f"{rule.result_range}<SEP>{rule.description}" if rule.description else rule.result_range
                    break
        
        dimensions_to_create.append(
            TestSessionDimension(dimension_code=dim_code, score=score, result_range=found_rule_text)
        )

    return total_score, "Processing...", dimensions_to_create

# ---------------------------------------------------------------
# [新增] HPLP 专属计分函数
# ---------------------------------------------------------------
async def _calculate_hplp_results(
    db: AsyncSession, 
    test_id: int,
    options_from_db: List[QuestionOption]
) -> Tuple[int, str, List[TestSessionDimension]]:
    """
    专门为“健康促进生活方式量表”(HPLP) 计分。
    """
    
    # 1. 初始化分数
    dim_scores: Dict[str, int] = {
        "HR": 0, "PA": 0, "N": 0, "IR": 0, "SM": 0, "SG": 0
    }
    total_score = 0
    
    # 2. 遍历用户选择的选项进行计分
    for opt in options_from_db:
        q_index = opt.question.order_index
        score = opt.score
        
        # 累加总分
        total_score += score 
        
        # 查找维度并累加
        dim_code = HPLP_DIMENSION_MAP.get(q_index)
        if dim_code in dim_scores:
            dim_scores[dim_code] += score
            
    # 3. 从数据库加载此测试的 *所有* 维度规则
    stmt_rules = select(TestResult).where(
        TestResult.test_id == test_id,
        TestResult.dimension_code.isnot(None) 
    )
    result_rules = await db.execute(stmt_rules)
    dimension_rules = result_rules.scalars().all()

    dimensions_to_create: List[TestSessionDimension] = []
    
    # 4. 匹配得分和规则
    for dim_code, score in dim_scores.items():
        found_rule_text = f"未找到 {dim_code} 的规则"
        
        for rule in dimension_rules:
            if rule.dimension_code == dim_code:
                if (rule.min_score <= score and 
                   (rule.max_score is None or rule.max_score >= score)):
                    if rule.description:
                        # 使用 <SEP> 分隔标题和描述
                        found_rule_text = f"{rule.result_range}<SEP>{rule.description}"
                    else:
                        found_rule_text = rule.result_range
                    break 
        
        dimensions_to_create.append(
            TestSessionDimension(
                dimension_code=dim_code,
                score=score,
                result_range=found_rule_text
            )
        )

    return total_score, "Processing...", dimensions_to_create


# ---------------------------------------------------------------
# 辅助函数 (MBTI / Sum)
# ---------------------------------------------------------------
async def _calculate_mbti_score(options_from_db: List[QuestionOption]) -> Tuple[int, str]:
    trait_map = {1: 'E', 2: 'I', 3: 'N', 4: 'S', 5: 'F', 6: 'T', 7: 'J', 8: 'P'}
    counts = {'EI': {'E': 0, 'I': 0}, 'SN': {'S': 0, 'N': 0}, 'TF': {'T': 0, 'F': 0}, 'JP': {'J': 0, 'P': 0}}

    for opt in options_from_db:
        if not opt.question: continue
        order_idx = opt.question.order_index
        trait_letter = trait_map.get(opt.score)
        if not trait_letter: continue
        if 1 <= order_idx <= 7 and trait_letter in counts['EI']: counts['EI'][trait_letter] += 1
        elif 8 <= order_idx <= 14 and trait_letter in counts['SN']: counts['SN'][trait_letter] += 1
        elif 15 <= order_idx <= 21 and trait_letter in counts['TF']: counts['TF'][trait_letter] += 1
        elif 22 <= order_idx <= 28 and trait_letter in counts['JP']: counts['JP'][trait_letter] += 1
    type_code = ""
    type_code += "I" if counts['EI']['I'] > counts['EI']['E'] else "E"
    type_code += "N" if counts['SN']['N'] > counts['SN']['S'] else "S"
    type_code += "T" if counts['TF']['T'] > counts['TF']['F'] else "F"
    type_code += "J" if counts['JP']['J'] > counts['JP']['P'] else "P"
    score_encoding = {'E': 1000, 'I': 2000, 'S': 100, 'N': 200, 'T': 10, 'F': 20, 'J': 1, 'P': 2}
    total_score = sum(score_encoding[letter] for letter in type_code)
    return total_score, type_code

async def _calculate_sum_score(options_from_db: List[QuestionOption]) -> int:
    return sum(opt.score for opt in options_from_db)


# ---------------------------------------------------------------
# [核心] calculate_and_save_session
# ---------------------------------------------------------------
async def calculate_and_save_session(
    db: AsyncSession, 
    test_id: int, 
    submission: schemas.TestSubmission
) -> TestSession:
    
    # --- 1. 获取 Test 信息 ---
    test_stmt = select(Test).where(Test.id == test_id)
    test_result = await db.execute(test_stmt)
    db_test = test_result.scalars().first()
    
    if not db_test:
        raise HTTPException(status_code=404, detail="Test not found")

    # --- 2. 准备数据 ---
    selected_option_ids = [ans.selected_option_id for ans in submission.answers]
    if not selected_option_ids:
        raise HTTPException(status_code=400, detail="No answers submitted")

    db_answers_to_create = [
        UserAnswer(
            question_id=ans.question_id,
            selected_option_id=ans.selected_option_id
        ) for ans in submission.answers
    ]
    
    stmt_scores = (
        select(QuestionOption)
        .where(QuestionOption.id.in_(selected_option_ids))
        .options(selectinload(QuestionOption.question)) 
    )
    result_scores = await db.execute(stmt_scores)
    options_from_db = result_scores.scalars().all()

    if len(options_from_db) != len(set(selected_option_ids)):
        raise HTTPException(status_code=400, detail="One or more selected options are invalid.")

    # --- 3. 计分逻辑分发 ---
    total_score = 0
    result_text = "未定义的结果"
    stmt_result: Any = None 
    dimensions_to_add: List[TestSessionDimension] = [] 

    # [策略 A] MBTI
    if db_test.test_type == "mbti":
        total_score, type_code = await _calculate_mbti_score(options_from_db)
        stmt_result = select(TestResult).where(
            TestResult.test_id == test_id,
            TestResult.min_score == total_score,
            TestResult.dimension_code.is_(None) 
        )
        result_text = type_code
        
    # [策略 B] HPLP (你缺失的逻辑就在这里！)
    elif db_test.test_type == "hpls": 
        total_score, _, dimensions_to_add = \
            await _calculate_hplp_results(db, test_id, options_from_db)
        
        # 查询总分规则
        stmt_result = select(TestResult).where(
            TestResult.test_id == test_id,
            TestResult.min_score <= total_score,
            (TestResult.max_score >= total_score) | (TestResult.max_score.is_(None)),
            TestResult.dimension_code.is_(None) 
        )

    # --- [新增] MPS 分发逻辑 ---
    elif db_test.test_type == "mps":
        total_score, _, dimensions_to_add = await _calculate_mps_results(db, test_id, options_from_db)
        # MPS 没有总分结果，我们取高标准总分 (HST) 作为展示主结果
        hst_score = next((d.score for d in dimensions_to_add if d.dimension_code == "HST"), 0)
        stmt_result = select(TestResult).where(
            TestResult.test_id == test_id,
            TestResult.dimension_code == "HST", # 以高标准倾向作为主标题
            TestResult.min_score <= hst_score,
            (TestResult.max_score >= hst_score) | (TestResult.max_score.is_(None))
        )
        
    # [策略 C] 默认加总
    else: 
        total_score = await _calculate_sum_score(options_from_db)
        stmt_result = select(TestResult).where(
            TestResult.test_id == test_id,
            TestResult.min_score <= total_score,
            (TestResult.max_score >= total_score) | (TestResult.max_score.is_(None)),
            TestResult.dimension_code.is_(None)
        )
        result_text = "未定义的结果范围"

    # --- 4. 匹配总结果 ---
    if stmt_result is not None:
        result_obj = await db.execute(stmt_result)
        final_result_model = result_obj.scalars().first()
        if final_result_model:
            if final_result_model.description:
                result_text = f"{final_result_model.result_range}<SEP>{final_result_model.description}"
            else:
                result_text = final_result_model.result_range
        
    # --- 5. 保存到数据库 ---
    db_session = TestSession(
        user_id=submission.user_id,
        test_id=test_id,
        result=result_text,       
        total_score=total_score   
    )
    
    db_session.answers = db_answers_to_create
    
    # [关键] 将计算出的维度添加到会话中
    if dimensions_to_add:
        db_session.dimensions = dimensions_to_add

    db.add(db_session)
    
    # --- 6. 返回结果 ---
    await db.flush()
    await db.refresh(db_session)
    await db.refresh(db_session, attribute_names=["answers", "dimensions"])

    return db_session