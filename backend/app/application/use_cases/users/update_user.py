from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional
import uuid

from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.domain.entities.professor_assignment import ProfessorAssignment
from app.domain.entities.user import User, PapelUsuario
from app.domain.exceptions import DomainException, UsuarioNaoEncontradoError, PermissaoInsuficienteError
from app.application.ports.user_repository import UserRepository
from app.application.ports.professor_assignment_repository import ProfessorAssignmentRepository

@dataclass
class UpdateUserInput:
    user_id_to_update: uuid.UUID
    executor_papel: PapelUsuario
    tenant_id: uuid.UUID
    nome: str
    papel: PapelUsuario
    escola_id: Optional[uuid.UUID] = None
    aluno_ids: Optional[list[uuid.UUID]] = None

class UpdateUserUseCase:
    """Caso de uso para atualizar as informações de um usuário existente."""

    def __init__(self, uow: AbstractUnitOfWork, user_repo: UserRepository, assignment_repo: ProfessorAssignmentRepository):
        self.uow = uow
        self.user_repo = user_repo
        self.assignment_repo = assignment_repo

    async def execute(self, input_dto: UpdateUserInput) -> User:
        async with self.uow.transaction():
            # 1. Buscar usuário
            user_alvo = await self.user_repo.get_by_id(input_dto.user_id_to_update)
            if not user_alvo or user_alvo.tenant_id != input_dto.tenant_id:
                raise UsuarioNaoEncontradoError("Usuário não encontrado.")

            # 2. Verificar permissão do executor (Quem cria é quem edita)
            # Dummy entity check: 'pode_criar_usuario' also applies to editing role hierarchy.
            executor_dummy = User(
                tenant_id=input_dto.tenant_id,
                email="dummy@system",
                hashed_password="xx",
                nome="dummy",
                papel=input_dto.executor_papel
            )
            
            # Só pode atualizar se o executor tiver poder para gerenciar aquele papel
            if not executor_dummy.pode_criar_usuario(user_alvo.papel):
                raise PermissaoInsuficienteError(f"Você não tem permissão para editar um {user_alvo.papel}.")
            
            if input_dto.papel != user_alvo.papel and not executor_dummy.pode_criar_usuario(input_dto.papel):
                raise PermissaoInsuficienteError(f"Você não tem permissão para promover alguém a {input_dto.papel}.")

            # Se for prof_apoio ou prof_regente, exige escola
            if input_dto.papel in (PapelUsuario.PROF_APOIO, PapelUsuario.PROF_REGENTE) and not input_dto.escola_id:
                raise DomainException("Escola é obrigatória para o papel selecionado.")

            # 3. Atualizar dados
            user_alvo.nome = input_dto.nome
            user_alvo.papel = input_dto.papel
            user_alvo.escola_id = input_dto.escola_id
            
            # updated_at é gerenciado pelo sqlalchemy ou método de entidade, mas para segurança podemos atualizar
            user_alvo.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

            await self.user_repo.save(user_alvo)

            # 4. Atualizar professor_assignments se for PROF_REGENTE
            if input_dto.papel in (PapelUsuario.PROF_REGENTE, PapelUsuario.PROF_APOIO) and input_dto.escola_id is not None:
                # Revoga as atribuições anteriores
                active_assignments = await self.assignment_repo.list_active_by_user(user_alvo.id)
                now = datetime.now(timezone.utc).replace(tzinfo=None)
                for assignment in active_assignments:
                    assignment.revogar(now)
                    await self.assignment_repo.save(assignment)
                
                # Cria as novas atribuições
                if input_dto.aluno_ids:
                    for aluno_id in input_dto.aluno_ids:
                        new_assignment = ProfessorAssignment(
                            usuario_id=user_alvo.id,
                            escola_id=input_dto.escola_id,
                            aluno_id=aluno_id,
                            tipo_papel=input_dto.papel
                        )
                        await self.assignment_repo.save(new_assignment)

            return user_alvo
