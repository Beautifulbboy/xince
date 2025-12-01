from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey, TIMESTAMP,
    UniqueConstraint, Index 
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

# ---------------------------------------------------------------
# Table: tests
# ---------------------------------------------------------------
class Test(Base):
    __tablename__ = "tests"
    id = Column(Integer, primary_key=True, autoincrement=True)
    test_type = Column(String(100), nullable=False, unique=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    questions = relationship("Question", back_populates="test", cascade="all, delete-orphan")
    results = relationship("TestResult", back_populates="test", cascade="all, delete-orphan")
    sessions = relationship("TestSession", back_populates="test")

# ---------------------------------------------------------------
# Table: questions
# ---------------------------------------------------------------
class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    test_id = Column(Integer, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    order_index = Column(Integer, nullable=False)

    test = relationship("Test", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")
    user_answers = relationship("UserAnswer", back_populates="question")

# ---------------------------------------------------------------
# Table: question_options
# ---------------------------------------------------------------
class QuestionOption(Base):
    __tablename__ = "question_options"
    id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    text = Column(String(255), nullable=False)
    score = Column(Integer, nullable=False)

    question = relationship("Question", back_populates="options")
    user_answers = relationship("UserAnswer", back_populates="selected_option")

# ---------------------------------------------------------------
# Table: test_results
# ---------------------------------------------------------------
class TestResult(Base):
    __tablename__ = "test_results"
    id = Column(Integer, primary_key=True, autoincrement=True)
    test_id = Column(Integer, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)
    min_score = Column(Integer, nullable=False)
    max_score = Column(Integer)
    result_range = Column(String(255), nullable=False)
    description = Column(Text)
    
    # [新增] 维度代码，用于区分是总分规则(NULL)还是维度规则(如 "HR")
    dimension_code = Column(String(255), nullable=True, index=True)

    test = relationship("Test", back_populates="results")

# ---------------------------------------------------------------
# Table: test_sessions
# ---------------------------------------------------------------
class TestSession(Base):
    __tablename__ = "test_sessions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(255), nullable=False, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    result = Column(String(255), nullable=False)
    total_score = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    test = relationship("Test", back_populates="sessions")
    answers = relationship("UserAnswer", back_populates="session", cascade="all, delete-orphan")
    
    # [新增] 关联维度结果表
    dimensions = relationship(
        "TestSessionDimension", 
        back_populates="session", 
        cascade="all, delete-orphan"
    )

# ---------------------------------------------------------------
# Table: user_answers
# ---------------------------------------------------------------
class UserAnswer(Base):
    __tablename__ = "user_answers"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("test_sessions.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_option_id = Column(Integer, ForeignKey("question_options.id"), nullable=False)

    session = relationship("TestSession", back_populates="answers")
    question = relationship("Question", back_populates="user_answers")
    selected_option = relationship("QuestionOption", back_populates="user_answers")

# ---------------------------------------------------------------
# [新增] Table: test_session_dimensions
# ---------------------------------------------------------------
class TestSessionDimension(Base):
    __tablename__ = "test_session_dimensions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("test_sessions.id", ondelete="CASCADE"), nullable=False)
    dimension_code = Column(String(10), nullable=False)
    score = Column(Integer, nullable=False)
    result_range = Column(String(255), nullable=False)

    session = relationship("TestSession", back_populates="dimensions")
    
    __table_args__ = (
        Index('idx_session_dimension', 'session_id', 'dimension_code'),
    )