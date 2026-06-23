from dataclasses import dataclass
import uuid
from typing import Optional
from app.application.ports.user_repository import UserRepository
from app.application.ports.email_service import EmailService
from app.domain.entities.user import User, PapelUsuario
from app.infrastructure.security.passwords import get_password_hash

@dataclass
class CreateUserInput:
    tenant_id: uuid.UUID
    executor_papel: PapelUsuario
    email: str
    password: str
    nome: str
    papel: PapelUsuario
    escola_id: Optional[uuid.UUID] = None
    aluno_ids: Optional[list[uuid.UUID]] = None

from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.application.ports.professor_assignment_repository import ProfessorAssignmentRepository

from app.domain.exceptions import PermissaoInsuficienteError, EmailJaEmUsoError, DomainException

class CreateUserUseCase:
    """Caso de uso para criação de novos usuários com validação de hierarquia (RBAC).
    
    Este caso de uso garante que apenas usuários com permissões adequadas 
    possam criar novos integrantes no sistema, respeitando as regras de 
    negócio de cada papel (Admin, Coordenação, Prof. AEE).

    [Clean Architecture v4] InviteTokenService é injetado como port abstrato —
    o Use Case não conhece JWT nem qualquer detalhe de infraestrutura.
    """
    def __init__(self, uow: AbstractUnitOfWork, user_repo: UserRepository, email_service: EmailService, assignment_repo: ProfessorAssignmentRepository):
        self.uow = uow
        self.user_repo = user_repo
        self.email_service = email_service
        self.assignment_repo = assignment_repo

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
                
            existing_user = await self.user_repo.get_by_email(input_dto.email)
            if existing_user:
                raise EmailJaEmUsoError(input_dto.email)

            if input_dto.papel in (PapelUsuario.PROF_APOIO, PapelUsuario.PROF_REGENTE) and not input_dto.escola_id:
                raise DomainException("Escola é obrigatória para o papel selecionado.")

            user = User(
                tenant_id=input_dto.tenant_id,
                escola_id=input_dto.escola_id,
                email=input_dto.email,
                hashed_password=get_password_hash(input_dto.password),
                nome=input_dto.nome,
                papel=input_dto.papel,
                ativo=True
            )
            saved_user = await self.user_repo.save(user)
            
            if input_dto.papel == PapelUsuario.PROF_REGENTE and input_dto.aluno_ids and input_dto.escola_id:
                from app.domain.entities.professor_assignment import ProfessorAssignment
                for aluno_id in input_dto.aluno_ids:
                    assignment = ProfessorAssignment(
                        usuario_id=saved_user.id,
                        escola_id=input_dto.escola_id,
                        aluno_id=aluno_id,
                        tipo_papel=PapelUsuario.PROF_REGENTE
                    )
                    await self.assignment_repo.save(assignment)
            
            await self.email_service.send_welcome_email(
                to_email=saved_user.email,
                nome=saved_user.nome
            )
            
            return saved_user
