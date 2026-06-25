"""
Use Case: Obter Dados Sensíveis do Aluno
=========================================
Acesso auditado a campos sensíveis (diagnóstico, laudo) com
justificativa obrigatória (LGPD art. 37).

Extraído do endpoint GET /api/alunos/{id}/dados-sensiveis que
misturava validação de regra de negócio, persistência e lógica
HTTP diretamente no Router — violação crítica de Clean Architecture.
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
    JustificativaInsuficienteError,
    TenantMismatchError,
)
from app.domain.models import Student

_JUSTIFICATIVA_MINIMA = 10


@dataclass
class GetSensitiveDataInput:
    student_id: uuid.UUID
    tenant_id: uuid.UUID
    papel: PapelUsuario
    user_id: uuid.UUID
    justificativa: str


class GetSensitiveDataUseCase:
    """Caso de uso para acesso auditado a dados sensíveis do aluno.

    Encapsula as regras de negócio LGPD:
    - Justificativa obrigatória (mínimo de caracteres).
    - Verificação de tenant antes de retornar dados.
    - Registro imutável de auditoria a cada acesso.
    """

    def __init__(
        self,
        uow: AbstractUnitOfWork,
        student_repo: StudentRepository,
        audit_repo: AuditLogRepository,
    ) -> None:
        self.uow = uow
        self.student_repo = student_repo
        self.audit_repo = audit_repo

    async def execute(self, input_dto: GetSensitiveDataInput) -> Student:
        """Valida acesso, registra auditoria e retorna o aluno com dados sensíveis.

        Raises:
            JustificativaInsuficienteError: se justificativa for curta demais.
            AlunoNaoEncontradoError: se o aluno não existir.
            TenantMismatchError: se o aluno pertencer a outro tenant.
        """
        # Regra de negócio 1: justificativa mínima (LGPD art. 37)
        if len(input_dto.justificativa) < _JUSTIFICATIVA_MINIMA:
            raise JustificativaInsuficienteError(minimo=_JUSTIFICATIVA_MINIMA)

        async with self.uow.transaction():
            professor_id = input_dto.user_id if input_dto.papel in (PapelUsuario.PROF_APOIO, PapelUsuario.PROF_REGENTE) else None
            student = await self.student_repo.get_by_id(input_dto.student_id, professor_id=professor_id)

            # Regra de negócio 2: aluno deve existir e pertencer ao tenant
            if student is None:
                raise AlunoNaoEncontradoError(input_dto.student_id)
            if student.tenant_id != input_dto.tenant_id and input_dto.papel != PapelUsuario.ADMIN:
                raise TenantMismatchError("aluno")

            # Regra LGPD: registrar acesso com justificativa
            log = AuditLog(
                student_id=student.id,
                user_id=input_dto.user_id,
                field_accessed=f"diagnostico, laudo (Justificada: {input_dto.justificativa})",
                accessed_at=datetime.now(UTC).replace(tzinfo=None),
            )
            await self.audit_repo.save(log)

            return student
