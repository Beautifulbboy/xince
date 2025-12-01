from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Union
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.schemas import schemas
from app.services import test_service, session_service 
from app.models.models import TestSession 

router = APIRouter()

# --- Test Endpoints ---

@router.post("/tests", response_model=schemas.Test, status_code=201)
async def create_new_test(
    test_in: schemas.TestCreate, 
    db: AsyncSession = Depends(get_db)
):
    existing_test = await test_service.get_test_by_type(db, test_in.test_type)
    if existing_test:
        raise HTTPException(status_code=400, detail=f"Test with type '{test_in.test_type}' already exists.")
    db_test = await test_service.create_test(db=db, test=test_in)
    return db_test

@router.get("/tests/popular", response_model=List[schemas.PopularTest])
async def get_popular_tests(db: AsyncSession = Depends(get_db)):
    popular_tests = await test_service.get_popular_tests(db=db, limit=6)
    return popular_tests

@router.get("/tests/{test_type}", response_model=Union[schemas.Test, schemas.TestForTaking])
async def get_test_for_taking(
    test_type: str, 
    include_scores: bool = False, 
    db: AsyncSession = Depends(get_db)
):
    db_test = await test_service.get_test_by_type(db=db, test_type=test_type, include_scores=include_scores)
    if db_test is None:
        raise HTTPException(status_code=404, detail="Test not found")
    return db_test

# --- Session/Submission Endpoints ---

@router.post("/tests/{test_id}/submit", response_model=schemas.TestSession)
async def submit_test(
    test_id: int,
    submission_in: schemas.TestSubmission,
    db: AsyncSession = Depends(get_db)
):
    try:
        result_session = await session_service.calculate_and_save_session(
            db=db, test_id=test_id, submission=submission_in
        )
        return result_session
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred while processing the submission.")

@router.get("/sessions/{session_id}", response_model=schemas.TestSession)
async def get_session_result(
    session_id: int,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(TestSession)
        .where(TestSession.id == session_id)
        # [关键修复] 添加了 selectinload(TestSession.dimensions)
        .options(
            selectinload(TestSession.answers),
            selectinload(TestSession.dimensions) 
        )
    )
    result = await db.execute(stmt)
    session = result.scalars().first()
    
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return session

@router.get("/users/{user_id}/sessions", response_model=List[schemas.TestSession])
async def get_user_sessions(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(TestSession)
        .where(TestSession.user_id == user_id)
        # [关键修复] 添加了 selectinload(TestSession.dimensions)
        .options(
            selectinload(TestSession.answers),
            selectinload(TestSession.dimensions)
        )
        .order_by(TestSession.created_at.desc())
    )
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    
    return sessions