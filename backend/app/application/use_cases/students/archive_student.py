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
class ArchiveStudentInput:
    """DTO de entrada para arquivamento de aluno.

    Dado que o aluno existe e está ativo,
    Quando ArchiveStudentUseCase.execute() é chamado,
    Então MUST arquivar o aluno (status='arquivado') e gerar entrada de auditoria.

    Dado que o aluno já está arquivado,
    Quando execute() é chamado,
    Então MUST lançar AlunoJaArquivadoError sem modificar o estado.

    Dado que o tenant_id do aluno é diferente do executor (não-ADMIN),
    Quando execute() é chamado,
    Então MUST lançar TenantMismatchError.
    """
    student_id: uuid.UUID
    tenant_id: uuid.UUID
    papel: PapelUsuario
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
        """Executa o arquivamento do aluno dentro de uma transação atômica.

        Etapas:
        1. Valida existência e tenant do aluno.
        2. Delega o soft-delete ao método rico student.arquivar(user_id).
        3. Persiste via student_repo.save().
        4. Registra entrada de auditoria LGPD obrigatoriamente.
        """
        async with self.uow.transaction():
            professor_id = input_dto.user_id if input_dto.papel in (PapelUsuario.PROF_APOIO, PapelUsuario.PROF_REGENTE) else None
            student = await self.student_repo.get_by_id(input_dto.student_id, professor_id=professor_id)

            if student is None:
                raise AlunoNaoEncontradoError(input_dto.student_id)
            if str(student.tenant_id) != str(input_dto.tenant_id) and input_dto.papel.value != PapelUsuario.ADMIN.value:
                raise TenantMismatchError("aluno")

            # Método rico valida estado e lança AlunoJaArquivadoError se necessário
            student.arquivar(input_dto.user_id)

            saved_student = await self.student_repo.save(student)

            # Registra auditoria do arquivamento (LGPD)
            audit_log = AuditLog(
                user_id=input_dto.user_id,
                student_id=input_dto.student_id,
                field_accessed="status (arquivamento)",
                accessed_at=datetime.now(UTC).replace(tzinfo=None),
            )
            await self.audit_repo.save(audit_log)

            return saved_student
