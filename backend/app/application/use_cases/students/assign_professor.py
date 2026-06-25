"""
Use Case: Vincular Professor a Aluno
=====================================
Orquestra o vínculo docente escola-específico.

[Clean Architecture v3] Usa AbstractUnitOfWork em vez de AsyncSession.
"""

import uuid
from dataclasses import dataclass

from app.application.ports.professor_assignment_repository import ProfessorAssignmentRepository
from app.application.ports.student_repository import StudentRepository
from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.domain.entities.professor_assignment import ProfessorAssignment
from app.domain.entities.user import PapelUsuario
from app.domain.exceptions import (
    AlunoSemEscolaError,
    TenantMismatchError,
    VinculoDuplicadoError,
)


@dataclass
class AssignProfessorInput:
    tenant_id: uuid.UUID
    student_id: uuid.UUID
    usuario_id: uuid.UUID
    tipo_papel: PapelUsuario
    executor_papel: PapelUsuario
    executor_user_id: uuid.UUID


class AssignProfessorUseCase:
    """Caso de uso para vincular professores ou profissionais de apoio a um aluno."""

    def __init__(
        self,
        uow: AbstractUnitOfWork,
        student_repo: StudentRepository,
        assignment_repo: ProfessorAssignmentRepository,
    ) -> None:
        self.uow = uow
        self.student_repo = student_repo
        self.assignment_repo = assignment_repo

    async def execute(self, input_dto: AssignProfessorInput) -> ProfessorAssignment:
        """Cria um novo vínculo docente para um aluno dentro de uma transação."""
        async with self.uow.transaction():
            professor_id = input_dto.executor_user_id if input_dto.executor_papel in (PapelUsuario.PROF_APOIO, PapelUsuario.PROF_REGENTE) else None
            student = await self.student_repo.get_by_id(input_dto.student_id, professor_id=professor_id)

            if not student or (student.tenant_id != input_dto.tenant_id and input_dto.executor_papel != PapelUsuario.ADMIN):
                raise TenantMismatchError("aluno")

            if not student.escola_atual_id:
                raise AlunoSemEscolaError()

            # Verificar se já existe vínculo ativo
            ativos = await self.assignment_repo.list_active_by_student(input_dto.student_id)
            for a in ativos:
                if a.usuario_id == input_dto.usuario_id and a.ativo:
                    raise VinculoDuplicadoError()

            assignment = ProfessorAssignment(
                usuario_id=input_dto.usuario_id,
                escola_id=student.escola_atual_id,
                aluno_id=input_dto.student_id,
                tipo_papel=input_dto.tipo_papel,
            )

            return await self.assignment_repo.save(assignment)
