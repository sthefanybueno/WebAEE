import uuid
from dataclasses import dataclass

from app.application.ports.email_service import EmailService
from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.application.ports.user_repository import UserRepository
from app.domain.entities.user import PapelUsuario
from app.domain.exceptions import PermissaoInsuficienteError, UsuarioNaoEncontradoError


@dataclass
class ToggleUserStatusInput:
    user_id_to_toggle: uuid.UUID
    executor_id: uuid.UUID
    executor_papel: PapelUsuario
    tenant_id: uuid.UUID
    novo_status: bool

class ToggleUserStatusUseCase:
    """Caso de uso para ativar ou desativar o login de um usuário."""

    def __init__(self, uow: AbstractUnitOfWork, user_repo: UserRepository, email_service: EmailService):
        self.uow = uow
        self.user_repo = user_repo
        self.email_service = email_service

    async def execute(self, input_dto: ToggleUserStatusInput) -> None:
        async with self.uow.transaction():
            # 1. Verifica permissão de quem executa
            if input_dto.executor_papel not in (PapelUsuario.ADMIN, PapelUsuario.COORDENACAO):
                raise PermissaoInsuficienteError("Apenas ADMIN e COORDENACAO podem alterar status de usuários.")

            # 2. Busca o usuário alvo
            user_alvo = await self.user_repo.get_by_id(input_dto.user_id_to_toggle)
            if not user_alvo or user_alvo.tenant_id != input_dto.tenant_id:
                raise UsuarioNaoEncontradoError("Usuário não encontrado.")

            # Regra: Um usuário não pode desativar a si mesmo por segurança? (Opcional, mas boa prática)
            if user_alvo.id == input_dto.executor_id:
                raise PermissaoInsuficienteError("Você não pode alterar o próprio status.")

            # 3. Altera o status
            user_alvo.ativo = input_dto.novo_status
            
            # Se a entidade tivesse um método reativar, usaríamos. Mas ativo é apenas bool.
            if not input_dto.novo_status:
                user_alvo.desativar() # Chama o método de domínio caso ele atualize 'updated_at'

            await self.user_repo.save(user_alvo)
            
            await self.email_service.send_status_change_email(
                to_email=user_alvo.email,
                nome=user_alvo.nome,
                ativo=user_alvo.ativo
            )
