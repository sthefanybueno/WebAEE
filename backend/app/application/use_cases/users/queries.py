import uuid
from dataclasses import dataclass
from typing import List

from app.application.ports.user_repository import UserRepository
from app.domain.entities.user import User
from app.domain.exceptions import UsuarioNaoEncontradoError

@dataclass
class ListUsersInput:
    tenant_id: uuid.UUID

class ListUsersUseCase:
    """Caso de uso para listar usuários do tenant."""
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def execute(self, input_dto: ListUsersInput) -> List[User]:
        # Para fins de simplificação, assumimos que o user_repo tem este método.
        # Caso contrário, vamos adicioná-lo.
        return await self.user_repo.list_by_tenant(input_dto.tenant_id)


@dataclass
class GetUserInput:
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
