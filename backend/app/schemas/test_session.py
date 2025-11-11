from pydantic import BaseModel
from typing import List

# Schemas for reading data (from DB to API)
class QuestionOption(BaseModel):
    id: int
    text: str
    score: int
    class Config:
        orm_mode = True

class Question(BaseModel):
    id: int
    text: str
    order_index: int
    options: List[QuestionOption]
    class Config:
        orm_mode = True

class Test(BaseModel):
    id: int
    test_type: str
    title: str
    description: str | None = None
    questions: List[Question]
    class Config:
        orm_mode = True

# Schemas for creating data (from API to DB)
class UserAnswerCreate(BaseModel):
    question_id: int
    selected_option_id: int

class TestSessionCreate(BaseModel):
    user_id: str
    test_type: str
    answers: List[UserAnswerCreate]