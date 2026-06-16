from dataclasses import dataclass
import uuid
from app.application.ports.user_repository import UserRepository
from app.application.ports.email_service import EmailService
from app.application.ports.invite_token_service import InviteTokenService
from app.domain.entities.user import User, PapelUsuario

@dataclass
class CreateUserInput:
    tenant_id: uuid.UUID
    executor_papel: PapelUsuario
    email: str
    nome: str
    papel: PapelUsuario

from app.application.ports.unit_of_work import AbstractUnitOfWork

from app.domain.exceptions import PermissaoInsuficienteError, EmailJaEmUsoError, DomainException

class CreateUserUseCase:
    """Caso de uso para criação de novos usuários com validação de hierarquia (RBAC).
    
    Este caso de uso garante que apenas usuários com permissões adequadas 
    possam criar novos integrantes no sistema, respeitando as regras de 
    negócio de cada papel (Admin, Coordenação, Prof. AEE).

    [Clean Architecture v4] InviteTokenService é injetado como port abstrato —
    o Use Case não conhece JWT nem qualquer detalhe de infraestrutura.
    """
    def __init__(
        self,
        uow: AbstractUnitOfWork,
        user_repo: UserRepository,
        email_service: EmailService,
        token_service: InviteTokenService,
    ):
        self.uow = uow
        self.user_repo = user_repo
        self.email_service = email_service
        self.token_service = token_service

    async def execute(self, input_dto: CreateUserInput) -> User:
        """Cria um novo usuário no sistema dentro de uma transação.
        """
        async with self.uow.transaction():
            # Regras de criação por papel (RBAC):
            # ADMIN      → pode criar qualquer papel
            # COORDENACAO → pode criar coordenacao, prof_aee, prof_apoio, prof_regente
            # PROF_AEE   → só pode criar prof_apoio
            # outros     → não podem criar ninguém

            if input_dto.papel == PapelUsuario.ADMIN and input_dto.executor_papel != PapelUsuario.ADMIN:
                raise PermissaoInsuficienteError(acao="criar usuário ADMIN", papel_requerido="ADMIN")

            if input_dto.executor_papel == PapelUsuario.PROF_AEE and input_dto.papel != PapelUsuario.PROF_APOIO:
                raise PermissaoInsuficienteError(acao="criar usuário", papel_requerido="ADMIN ou COORDENACAO")

            if input_dto.executor_papel not in (PapelUsuario.ADMIN, PapelUsuario.COORDENACAO, PapelUsuario.PROF_AEE):
                raise PermissaoInsuficienteError(acao="cadastrar usuários")
                
            # Verifica duplicidade
            existing_user = await self.user_repo.get_by_email(input_dto.email)
            if existing_user:
                raise EmailJaEmUsoError(input_dto.email)

            user = User(
                tenant_id=input_dto.tenant_id,
                email=input_dto.email,
                hashed_password="PENDING_INVITE",
                nome=input_dto.nome,
                papel=input_dto.papel,
                ativo=False # Usuário fica inativo até aceitar o convite
            )
            saved_user = await self.user_repo.save(user)
            
            # Gerar token e disparar e-mail fora da transação de banco se preferir, 
            # mas aqui disparamos no fluxo
            token = self.token_service.create_invite_token(saved_user.id)
            await self.email_service.send_invite_email(to_email=saved_user.email, token=token)
            
            return saved_user
