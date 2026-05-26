"""
Use Case: Transferir Aluno
==========================
Orquestra a transferência de escola de um aluno (operação atômica).

[DDD v2] Usa exceções de domínio e chama métodos ricos.
[Clean Architecture v3] Usa AbstractUnitOfWork em vez de AsyncSession.
"""

import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.application.ports.professor_assignment_repository import (
    ProfessorAssignmentRepository,
)
from app.application.ports.school_repository import SchoolRepository
from app.application.ports.student_history_repository import (
    StudentSchoolHistoryRepository,
)
from app.application.ports.student_repository import StudentRepository
from app.domain.entities.student_history import StudentSchoolHistory
from app.domain.exceptions import (
    AlunoNaoEncontradoError,
    EscolaNaoEncontradaError,
    TenantMismatchError,
)
from app.domain.models import Student


@dataclass
class TransferStudentInput:
    student_id: uuid.UUID
    nova_escola_id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID


class TransferStudentUseCase:
    """Caso de uso para transferência de escola de um aluno."""

    def __init__(
        self,
        uow: AbstractUnitOfWork,
        student_repo: StudentRepository,
        school_repo: SchoolRepository,
        assignment_repo: ProfessorAssignmentRepository,
        history_repo: StudentSchoolHistoryRepository,
    ) -> None:
        self.uow = uow
        self.student_repo = student_repo
        self.school_repo = school_repo
        self.assignment_repo = assignment_repo
        self.history_repo = history_repo

    async def execute(self, input_dto: TransferStudentInput) -> Student:
        """Executa a transferência do aluno entre escolas do mesmo tenant."""
        async with self.uow.transaction():
            student = await self.student_repo.get_by_id(input_dto.student_id)
            if student is None:
                raise AlunoNaoEncontradoError(input_dto.student_id)
            if student.tenant_id != input_dto.tenant_id:
                raise TenantMismatchError("aluno")

            nova_escola = await self.school_repo.get_by_id(input_dto.nova_escola_id)
            if nova_escola is None:
                raise EscolaNaoEncontradaError(input_dto.nova_escola_id)
            if nova_escola.tenant_id != input_dto.tenant_id:
                raise TenantMismatchError("escola de destino")

            # Revogar vínculos ativos via método rico da entidade
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            active_assignments = await self.assignment_repo.list_active_by_student(
                input_dto.student_id
            )
            for assignment in active_assignments:
                assignment.revogar(now)
                await self.assignment_repo.save(assignment)

            # Transferir via método rico da entidade
            student.transferir_para(input_dto.nova_escola_id, input_dto.user_id)
            saved_student = await self.student_repo.save(student)

            # Salvar histórico imutável da transferência
            history = StudentSchoolHistory(
                student_id=input_dto.student_id,
                school_id=input_dto.nova_escola_id,
                user_id=input_dto.user_id,
                transfer_date=now,
            )
            await self.history_repo.save(history)

            return saved_student
