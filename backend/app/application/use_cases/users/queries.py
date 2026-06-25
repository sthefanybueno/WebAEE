import uuid

from pydantic import BaseModel, Field

from app.application.ports.user_repository import UserRepository
from app.domain.entities.user import User
from app.domain.exceptions import UsuarioNaoEncontradoError


class ListUsersInput(BaseModel):
    tenant_id: uuid.UUID
    nome: str | None = None
    papel: str | None = None
    page: int = Field(default=1, ge=1)
    size: int = Field(default=50, ge=1, le=100)

class PaginatedUsers(BaseModel):
    items: list[User]
    total: int
    page: int
    size: int

class ListUsersUseCase:
    """Caso de uso para listar usuários do tenant."""
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def execute(self, input_dto: ListUsersInput) -> PaginatedUsers:
        items, total = await self.user_repo.list_by_tenant(
            tenant_id=input_dto.tenant_id,
            nome=input_dto.nome,
            papel=input_dto.papel,
            page=input_dto.page,
            size=input_dto.size
        )
        return PaginatedUsers(
            items=items,
            total=total,
            page=input_dto.page,
            size=input_dto.size
        )


class GetUserInput(BaseModel):
    user_id: uuid.UUID
    tenant_id: uuid.UUID

class GetUserUseCase:
    """Caso de uso para buscar um usuário do tenant."""
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def execute(self, input_dto: GetUserInput) -> User:
        user = await self.user_repo.get_by_id(input_dto.user_id)
        if not user or user.tenant_id != input_dto.tenant_id:
            raise UsuarioNaoEncontradoError(input_dto.user_id)
        return user
