"""
Use Case: Transferir Aluno
==========================
Orquestra a transferência de escola de um aluno (operação atômica).

Mudança DDD (v2): usa exceções de domínio e chama métodos ricos
(student.transferir_para, assignment.revogar) em vez de manipular
campos diretamente.
"""

import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlmodel.ext.asyncio.session import AsyncSession

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
    """Caso de uso para transferência de escola de um aluno.

    Esta operação é complexa pois envolve:
    1. Vinculação do aluno a uma nova escola.
    2. Revogação automática de todos os acessos (vínculos) de professores da escola anterior.
    3. Registro de histórico de transferências para rastreabilidade pedagógica.

    [DDD v2] Delega para métodos ricos das entidades:
    - student.transferir_para() — encapsula mudança de escola + auditoria
    - assignment.revogar() — encapsula encerramento de vínculo com data_fim
    """

    def __init__(
        self,
        session: AsyncSession,
        student_repo: StudentRepository,
        school_repo: SchoolRepository,
        assignment_repo: ProfessorAssignmentRepository,
        history_repo: StudentSchoolHistoryRepository,
    ) -> None:
        self.session = session
        self.student_repo = student_repo
        self.school_repo = school_repo
        self.assignment_repo = assignment_repo
        self.history_repo = history_repo

    async def execute(self, input_dto: TransferStudentInput) -> Student:
        """Executa a transferência do aluno entre escolas do mesmo tenant.

        Esta operação é executada dentro de uma transação atômica.
        """
        async with self.session.begin():
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

            # Transferir via método rico da entidade (valida estado + rastreabilidade)
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
