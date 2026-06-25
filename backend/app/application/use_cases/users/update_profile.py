from dataclasses import dataclass
from typing import Optional
import uuid

from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.domain.entities.user import User, PapelUsuario
from app.domain.exceptions import UsuarioNaoEncontradoError, EmailJaEmUsoError, DomainException
from app.application.ports.user_repository import UserRepository
from datetime import datetime, timezone

@dataclass
class UpdateProfileInput:
    user_id: uuid.UUID
    tenant_id: uuid.UUID
    nome: str
    email: str
    escola_id: Optional[uuid.UUID] = None

class UpdateProfileUseCase:
    """Caso de uso para usuário atualizar seu próprio perfil."""

    def __init__(self, uow: AbstractUnitOfWork, user_repo: UserRepository):
        self.uow = uow
        self.user_repo = user_repo

    async def execute(self, input_dto: UpdateProfileInput) -> User:
        async with self.uow.transaction():
            # 1. Buscar usuário logado
            user_alvo = await self.user_repo.get_by_id(input_dto.user_id)
            if not user_alvo or user_alvo.tenant_id != input_dto.tenant_id:
                raise UsuarioNaoEncontradoError("Usuário não encontrado.")

            # 2. Verificar e-mail se foi alterado
            if input_dto.email != user_alvo.email:
                existing_user = await self.user_repo.get_by_email(input_dto.email)
                if existing_user and existing_user.id != user_alvo.id:
                    raise EmailJaEmUsoError("Este e-mail já está em uso por outra conta.")

            # 3. Atualizar dados
            user_alvo.nome = input_dto.nome
            user_alvo.email = input_dto.email
            user_alvo.escola_id = input_dto.escola_id
            user_alvo.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

            await self.user_repo.save(user_alvo)

            return user_alvo
