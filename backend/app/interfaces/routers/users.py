from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.use_cases.users.create_user import (
    CreateUserInput,
    CreateUserUseCase,
)
from app.infrastructure.database import get_session
from app.infrastructure.unit_of_work_impl import SQLAlchemyUnitOfWork
from app.infrastructure.repositories.user_repository_impl import (
    SQLModelUserRepository,
)
from app.infrastructure.repositories.professor_assignment_repository_impl import SQLModelProfessorAssignmentRepository
from app.infrastructure.services.email_service_impl import ConsoleEmailService
from app.interfaces.dependencies import CurrentUser, get_current_user
from app.interfaces.schemas.user import CreateUserRequest, UserResponse
from app.interfaces.schemas.pagination import PaginatedResponse
from app.domain.entities.user import User, PapelUsuario

from app.domain.exceptions import (
    DomainException,
    EmailJaEmUsoError,
    UsuarioNaoEncontradoError,
    TenantMismatchError,
    PermissaoInsuficienteError,
)

router = APIRouter(prefix="/api/usuarios", tags=["usuarios"])

_DOMAIN_TO_HTTP: dict[type, int] = {
    UsuarioNaoEncontradoError: status.HTTP_404_NOT_FOUND,
    TenantMismatchError: status.HTTP_403_FORBIDDEN,
    PermissaoInsuficienteError: status.HTTP_403_FORBIDDEN,
    EmailJaEmUsoError: status.HTTP_409_CONFLICT,
}


def _handle_domain_exception(e: DomainException) -> None:
    status_code = _DOMAIN_TO_HTTP.get(type(e), status.HTTP_400_BAD_REQUEST)
    raise HTTPException(status_code=status_code, detail=str(e))

def get_create_user_use_case(session: AsyncSession = Depends(get_session)) -> CreateUserUseCase:
    return CreateUserUseCase(
        uow=SQLAlchemyUnitOfWork(session),
        user_repo=SQLModelUserRepository(session),
        email_service=ConsoleEmailService(),
        assignment_repo=SQLModelProfessorAssignmentRepository(session)
    )

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
        password=request.password,
        nome=request.nome,
        papel=request.papel,
        escola_id=request.escola_id,
    )
    try:
        user = await use_case.execute(input_dto)
        return user
    except DomainException as e:
        _handle_domain_exception(e)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=str(e)
        )

from app.application.use_cases.users.queries import ListUsersUseCase, ListUsersInput, GetUserUseCase, GetUserInput

def get_list_users_use_case(session: AsyncSession = Depends(get_session)) -> ListUsersUseCase:
    return ListUsersUseCase(user_repo=SQLModelUserRepository(session))

def get_get_user_use_case(session: AsyncSession = Depends(get_session)) -> GetUserUseCase:
    return GetUserUseCase(user_repo=SQLModelUserRepository(session))

@router.get("/", response_model=PaginatedResponse[UserResponse])
async def list_users(
    nome: Optional[str] = Query(None, description="Filtrar por nome"),
    papel: Optional[PapelUsuario] = Query(None, description="Filtrar por papel"),
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(50, ge=1, le=100, description="Tamanho da página"),
    current_user: CurrentUser = Depends(get_current_user),
    use_case: ListUsersUseCase = Depends(get_list_users_use_case),
):
    """Retorna usuários do mesmo tenant, com paginação e filtros opcionais."""
    try:
        input_dto = ListUsersInput(
            tenant_id=current_user.tenant_id,
            nome=nome,
            papel=papel,
            page=page,
            size=size
        )
        paginated_users = await use_case.execute(input_dto)
        return paginated_users
    except DomainException as e:
        _handle_domain_exception(e)

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: CurrentUser = Depends(get_current_user),
    use_case: GetUserUseCase = Depends(get_get_user_use_case),
):
    """
    Retorna os dados do usuário autenticado atual, com seu papel validado.
    """
    try:
        input_dto = GetUserInput(user_id=current_user.id, tenant_id=current_user.tenant_id)
        return await use_case.execute(input_dto)
    except DomainException as e:
        _handle_domain_exception(e)



from app.application.use_cases.users.update_user import UpdateUserUseCase, UpdateUserInput
from app.application.use_cases.users.toggle_user_status import ToggleUserStatusUseCase, ToggleUserStatusInput
import uuid

def get_update_user_use_case(session: AsyncSession = Depends(get_session)) -> UpdateUserUseCase:
    return UpdateUserUseCase(
        uow=SQLAlchemyUnitOfWork(session), 
        user_repo=SQLModelUserRepository(session),
        assignment_repo=SQLModelProfessorAssignmentRepository(session)
    )

def get_toggle_status_use_case(session: AsyncSession = Depends(get_session)) -> ToggleUserStatusUseCase:
    return ToggleUserStatusUseCase(
        uow=SQLAlchemyUnitOfWork(session),
        user_repo=SQLModelUserRepository(session),
        email_service=ConsoleEmailService()
    )

from app.interfaces.schemas.user import UpdateUserRequest, ToggleStatusRequest

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    request: UpdateUserRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: UpdateUserUseCase = Depends(get_update_user_use_case),
):
    try:
        input_dto = UpdateUserInput(
            user_id_to_update=user_id,
            executor_papel=current_user.papel,
            tenant_id=current_user.tenant_id,
            nome=request.nome,
            papel=request.papel,
            escola_id=request.escola_id
        )
        return await use_case.execute(input_dto)
    except DomainException as e:
        _handle_domain_exception(e)

@router.patch("/{user_id}/status", status_code=status.HTTP_204_NO_CONTENT)
async def toggle_user_status(
    user_id: uuid.UUID,
    request: ToggleStatusRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: ToggleUserStatusUseCase = Depends(get_toggle_status_use_case),
):
    try:
        input_dto = ToggleUserStatusInput(
            user_id_to_toggle=user_id,
            executor_id=current_user.id,
            executor_papel=current_user.papel,
            tenant_id=current_user.tenant_id,
            novo_status=request.ativo
        )
        await use_case.execute(input_dto)
    except DomainException as e:
        _handle_domain_exception(e)

@router.get("/{user_id}/alunos", response_model=List[uuid.UUID])
async def get_user_alunos(
    user_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Retorna os IDs dos alunos atribuídos a este professor regente."""
    repo = SQLModelProfessorAssignmentRepository(session)
    assignments = await repo.list_active_by_user(user_id)
    return [a.aluno_id for a in assignments]
