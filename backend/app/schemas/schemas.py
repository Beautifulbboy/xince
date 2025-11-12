from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# ----------------------------------------
# Question Option Schemas
# ----------------------------------------
class QuestionOptionBase(BaseModel):
    text: str
    score: int

class QuestionOptionCreate(QuestionOptionBase):
    pass

class QuestionOption(QuestionOptionBase):
    id: int
    question_id: int

    class Config:
        orm_mode = True

# ----------------------------------------
# Question Schemas
# ----------------------------------------
class QuestionBase(BaseModel):
    text: str
    order_index: int

class QuestionCreate(QuestionBase):
    options: List[QuestionOptionCreate] # 创建问题时，必须带上选项

class Question(QuestionBase):
    id: int
    test_id: int
    options: List[QuestionOption] = [] # 返回问题时，带上所有选项

    class Config:
        orm_mode = True

# ----------------------------------------
# Test Result Range Schemas
# ----------------------------------------
class TestResultBase(BaseModel):
    min_score: int
    max_score: Optional[int] = None
    result_range: str
    description: Optional[str] = None

class TestResultCreate(TestResultBase):
    pass

class TestResult(TestResultBase):
    id: int
    test_id: int

    class Config:
        orm_mode = True

# ----------------------------------------
# Test Schemas
# ----------------------------------------
class TestBase(BaseModel):
    title: str
    description: Optional[str] = None

class TestCreate(TestBase):
    test_type: str
    questions: List[QuestionCreate]
    results: List[TestResultCreate]

# 用于 API 响应：返回一个 Test 及其所有的问题和结果范围
class Test(TestBase):
    id: int
    test_type: str
    created_at: datetime
    questions: List[Question] = []
    results: List[TestResult] = []

    class Config:
        orm_mode = True

# 用于前端获取测试（只读，不含答案分数）
# 注意：我们稍后需要一个服务来剥离 'score'
class QuestionForTaking(BaseModel):
    id: int
    text: str
    order_index: int
    options: List[dict] # 在 service 层手动构造，只包含 {id, text}

    class Config:
        orm_mode = True

class TestForTaking(TestBase):
    id: int
    test_type: str
    questions: List[QuestionForTaking] = []

    class Config:
        orm_mode = True


# ----------------------------------------
# Test Submission Schemas
# ----------------------------------------
class UserAnswerInput(BaseModel):
    question_id: int
    selected_option_id: int

class TestSubmission(BaseModel):
    user_id: str # 假设是一个唯一的字符串ID
    answers: List[UserAnswerInput]


# ----------------------------------------
# Test Session (Result) Schemas
# ----------------------------------------
class UserAnswer(UserAnswerInput):
    id: int
    session_id: int

    class Config:
        orm_mode = True

class TestSession(BaseModel):
    id: int
    user_id: str
    test_id: int
    result: str
    total_score: int
    created_at: datetime
    answers: List[UserAnswer] = []

    class Config:
        orm_mode = True


# ----------------------------------------
# Popular Test Schemas
# ----------------------------------------
class PopularTest(BaseModel):
    id: int               # 数据库中的 test ID
    test_type: str        # 字符串 ID (例如 "mbti", "phq-9")
    title: str
    description: Optional[str] = None
    session_count: int    # 该测试被完成的次数

    class Config:
        orm_mode = True