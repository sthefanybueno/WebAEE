from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.use_cases.users.create_user import (
    CreateUserInput,
    CreateUserUseCase,
)
from app.infrastructure.database import get_session
from app.infrastructure.repositories.user_repository_impl import (
    SQLModelUserRepository,
)
from app.interfaces.dependencies import CurrentUser, get_current_user
from app.interfaces.schemas.user import CreateUserRequest, UserResponse
from app.domain.entities.user import User

router = APIRouter(prefix="/api/usuarios", tags=["usuarios"])

def get_create_user_use_case(session: AsyncSession = Depends(get_session)) -> CreateUserUseCase:
    return CreateUserUseCase(session=session, user_repo=SQLModelUserRepository(session))

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: CreateUserRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: CreateUserUseCase = Depends(get_create_user_use_case),
):
    input_dto = CreateUserInput(
        tenant_id=current_user.tenant_id,
        executor_papel=current_user.papel,
        email=request.email,
        nome=request.nome,
        papel=request.papel,
    )
    try:
        user = await use_case.execute(input_dto)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=str(e)
        )

@router.get("/", response_model=List[UserResponse])
async def list_users(
    session: AsyncSession = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Retorna usuários do mesmo tenant."""
    statement = select(User).where(User.tenant_id == current_user.tenant_id)
    result = await session.exec(statement)
    users = result.all()
    return list(users)

@router.get("/me", response_model=UserResponse)
async def get_me(
    session: AsyncSession = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Retorna os dados do usuário autenticado atual, com seu papel validado.
    """
    statement = select(User).where(User.id == current_user.id)
    result = await session.exec(statement)
    user = result.first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Usuário não encontrado."
        )
    return user
