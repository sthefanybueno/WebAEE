"""
Use Case: Ativar Aluno
========================
Orquestra a reativação de alunos (status → ATIVO) com auditoria LGPD.

[DDD v2] Usa exceções de domínio e chama student.ativar()
em vez de manipular status/updated_at diretamente.

[Clean Architecture v3] Usa AbstractUnitOfWork em vez de AsyncSession.
"""

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

from app.application.ports.audit_log_repository import AuditLogRepository
from app.application.ports.student_repository import StudentRepository
from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.domain.entities.audit_log import AuditLog
from app.domain.entities.user import PapelUsuario
from app.domain.exceptions import (
    AlunoNaoEncontradoError,
    TenantMismatchError,
)
from app.domain.models import Student


@dataclass
class ActivateStudentInput:
    student_id: uuid.UUID
    tenant_id: uuid.UUID
    papel: PapelUsuario
    user_id: uuid.UUID


class ActivateStudentUseCase:
    """Caso de uso para reativação de alunos."""

    def __init__(
        self,
        uow: AbstractUnitOfWork,
        student_repo: StudentRepository,
        audit_repo: AuditLogRepository,
    ) -> None:
        self.uow = uow
        self.student_repo = student_repo
        self.audit_repo = audit_repo

    async def execute(self, input_dto: ActivateStudentInput) -> Student:
        """Executa a reativação do aluno dentro de uma transação."""
        async with self.uow.transaction():
            professor_id = input_dto.user_id if input_dto.papel in (PapelUsuario.PROF_APOIO, PapelUsuario.PROF_REGENTE) else None
            student = await self.student_repo.get_by_id(input_dto.student_id, professor_id=professor_id)

            if student is None:
                raise AlunoNaoEncontradoError(input_dto.student_id)
            if str(student.tenant_id) != str(input_dto.tenant_id) and input_dto.papel.value != PapelUsuario.ADMIN.value:
                raise TenantMismatchError("aluno")

            # Método rico valida estado
            student.ativar(input_dto.user_id)

            saved_student = await self.student_repo.save(student)

            # Registra auditoria da reativação (LGPD)
            audit_log = AuditLog(
                user_id=input_dto.user_id,
                student_id=input_dto.student_id,
                field_accessed="status (reativação)",
                accessed_at=datetime.now(UTC).replace(tzinfo=None),
            )
            await self.audit_repo.save(audit_log)

            return saved_student
