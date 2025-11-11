from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class Test(Base):
    __tablename__ = 'tests'
    id = Column(Integer, primary_key=True, autoincrement=True)
    test_type = Column(String(100), nullable=False, unique=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    questions = relationship("Question", back_populates="test")
    results = relationship("TestResult", back_populates="test")

class Question(Base):
    __tablename__ = 'questions'
    id = Column(Integer, primary_key=True, autoincrement=True)
    test_id = Column(Integer, ForeignKey('tests.id', ondelete='CASCADE'), nullable=False)
    text = Column(Text, nullable=False)
    order_index = Column(Integer, nullable=False)
    test = relationship("Test", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")

class QuestionOption(Base):
    __tablename__ = 'question_options'
    id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(Integer, ForeignKey('questions.id', ondelete='CASCADE'), nullable=False)
    text = Column(String(255), nullable=False)
    score = Column(Integer, nullable=False)
    question = relationship("Question", back_populates="options")

class TestResult(Base):
    __tablename__ = 'test_results'
    id = Column(Integer, primary_key=True, autoincrement=True)
    test_id = Column(Integer, ForeignKey('tests.id', ondelete='CASCADE'), nullable=False)
    min_score = Column(Integer, nullable=False)
    max_score = Column(Integer)
    result_range = Column(String(255), nullable=False)
    description = Column(Text)
    test = relationship("Test", back_populates="results")

class TestSession(Base):
    __tablename__ = 'test_sessions'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(255), nullable=False)
    test_id = Column(Integer, ForeignKey('tests.id'), nullable=False)
    result = Column(String(255), nullable=False)
    total_score = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    answers = relationship("UserAnswer", back_populates="session", cascade="all, delete-orphan")

class UserAnswer(Base):
    __tablename__ = 'user_answers'
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey('test_sessions.id', ondelete='CASCADE'), nullable=False)
    question_id = Column(Integer, ForeignKey('questions.id'), nullable=False)
    selected_option_id = Column(Integer, ForeignKey('question_options.id'), nullable=False)
    session = relationship("TestSession", back_populates="answers")