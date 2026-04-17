import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from app.application.ports.audit_log_repository import AuditLogRepository
from app.application.ports.student_repository import StudentRepository
from app.domain.entities.audit_log import AuditLog
from app.domain.models import StatusAluno, Student


@dataclass
class ArchiveStudentInput:
    student_id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID


from sqlmodel.ext.asyncio.session import AsyncSession

class ArchiveStudentUseCase:
    """Caso de uso para arquivamento (soft-delete) de alunos.
    
    Este processo altera o status do aluno para 'arquivado' e registra 
    um log de auditoria conforme exigido pela LGPD, visto que o 
    arquivamento é uma operação que impacta a visibilidade de dados sensíveis.
    """
    def __init__(
        self, 
        session: AsyncSession,
        student_repo: StudentRepository, 
        audit_repo: AuditLogRepository
    ) -> None:
        self.session = session
        self.student_repo = student_repo
        self.audit_repo = audit_repo

    async def execute(self, input_dto: ArchiveStudentInput) -> Student:
        """Executa o arquivamento do aluno dentro de uma transação.
        """
        async with self.session.begin():
            student = await self.student_repo.get_by_id(input_dto.student_id)

            if not student or student.tenant_id != input_dto.tenant_id:
                raise ValueError("Aluno não encontrado ou não pertence a este tenant.")

            # Soft-delete obrigatório
            student.status = StatusAluno.ARQUIVADO.value  # type: ignore[attr-defined]
            student.updated_by = input_dto.user_id
            student.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

            saved_student = await self.student_repo.save(student)

            # Registra auditoria do arquivamento
            audit_log = AuditLog(
                user_id=input_dto.user_id,
                student_id=input_dto.student_id,
                field_accessed="status (arquivamento)",
                accessed_at=datetime.now(timezone.utc).replace(tzinfo=None),
            )
            await self.audit_repo.save(audit_log)

            return saved_student
