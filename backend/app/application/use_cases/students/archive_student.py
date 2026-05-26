"""
Use Case: Arquivar Aluno
========================
Orquestra o soft-delete de alunos com auditoria LGPD obrigatória.

[DDD v2] Usa exceções de domínio e chama student.arquivar()
em vez de manipular status/updated_at diretamente.

[Clean Architecture v3] Usa AbstractUnitOfWork em vez de AsyncSession.
"""

import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.application.ports.audit_log_repository import AuditLogRepository
from app.application.ports.student_repository import StudentRepository
from app.domain.entities.audit_log import AuditLog
from app.domain.exceptions import (
    AlunoJaArquivadoError,
    AlunoNaoEncontradoError,
    TenantMismatchError,
)
from app.domain.models import Student


@dataclass
class ArchiveStudentInput:
    student_id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID


class ArchiveStudentUseCase:
    """Caso de uso para arquivamento (soft-delete) de alunos."""

    def __init__(
        self,
        uow: AbstractUnitOfWork,
        student_repo: StudentRepository,
        audit_repo: AuditLogRepository,
    ) -> None:
        self.uow = uow
        self.student_repo = student_repo
        self.audit_repo = audit_repo

    async def execute(self, input_dto: ArchiveStudentInput) -> Student:
        """Executa o arquivamento do aluno dentro de uma transação."""
        async with self.uow.transaction():
            student = await self.student_repo.get_by_id(input_dto.student_id)

            if student is None:
                raise AlunoNaoEncontradoError(input_dto.student_id)
            if student.tenant_id != input_dto.tenant_id:
                raise TenantMismatchError("aluno")

            # Método rico valida estado e lança AlunoJaArquivadoError se necessário
            student.arquivar(input_dto.user_id)

            saved_student = await self.student_repo.save(student)

            # Registra auditoria do arquivamento (LGPD)
            audit_log = AuditLog(
                user_id=input_dto.user_id,
                student_id=input_dto.student_id,
                field_accessed="status (arquivamento)",
                accessed_at=datetime.now(timezone.utc).replace(tzinfo=None),
            )
            await self.audit_repo.save(audit_log)

            return saved_student
