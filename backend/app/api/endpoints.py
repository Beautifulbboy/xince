from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

# [新添加] 导入 select 和 selectinload
from typing import List, Union
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.schemas import schemas
from app.services import test_service, session_service 
from app.models.models import TestSession # 需要导入模型用于 get_session_result

router = APIRouter()

# --- Test Endpoints ---

@router.post("/tests", response_model=schemas.Test, status_code=201)
async def create_new_test(
    test_in: schemas.TestCreate, 
    db: AsyncSession = Depends(get_db)
):
    """
    (管理端) 创建一个新测试（包含所有问题、选项、结果）
    """
    # 检查 test_type 是否已存在 (可选但推荐)
    existing_test = await test_service.get_test_by_type(db, test_in.test_type)
    if existing_test:
        raise HTTPException(
            status_code=400, 
            detail=f"Test with type '{test_in.test_type}' already exists."
        )
        
    db_test = await test_service.create_test(db=db, test=test_in)
    return db_test


@router.get("/tests/{test_type}", response_model=Union[schemas.Test, schemas.TestForTaking]) # [修改] 1. 更改 response_model
async def get_test_for_taking(
    test_type: str, 
    include_scores: bool = False,  # [修改] 2. 添加查询参数
    db: AsyncSession = Depends(get_db)
):
    """
    (用户端) 获取一个测试用于答题。
    默认不含分数。
    传入 ?include_scores=true 来获取包含分数的完整测试数据。
    """
    # [修改] 3. 将参数传递给 service
    db_test = await test_service.get_test_by_type(
        db=db, 
        test_type=test_type, 
        include_scores=include_scores
    )
    
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
    """
    (用户端) 提交测试答案并获取结果
    """
    try:
        result_session = await session_service.calculate_and_save_session(
            db=db, test_id=test_id, submission=submission_in
        )
        return result_session
    except HTTPException as e:
        # 重新抛出 service 层或数据库层可能抛出的已知错误
        raise e
    except Exception as e:
        # 捕获未知错误
        print(f"An unexpected error occurred: {e}") # 打印日志
        raise HTTPException(status_code=500, detail="An internal error occurred while processing the submission.")


@router.get("/sessions/{session_id}", response_model=schemas.TestSession)
async def get_session_result(
    session_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    (用户端) 根据 ID 获取某次测试的结果
    """
    # [已修复] 这里的 select 和 selectinload 现在已经被导入
    stmt = (
        select(TestSession)
        .where(TestSession.id == session_id)
        .options(selectinload(TestSession.answers)) # 预加载答案
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
    """
    (用户端) 获取某个用户的所有测试历史
    """
    # [已修复] 这里的 select 和 selectinload 现在已经被导入
    stmt = (
        select(TestSession)
        .where(TestSession.user_id == user_id)
        .options(selectinload(TestSession.answers)) # 预加载答案
        .order_by(TestSession.created_at.desc()) # 按时间倒序
    )
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    
    return sessions