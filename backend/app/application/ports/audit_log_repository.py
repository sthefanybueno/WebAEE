import uuid
from typing import List, Protocol

from app.domain.entities.audit_log import AuditLog


class AuditLogRepository(Protocol):
    async def list_by_student(self, student_id: uuid.UUID) -> List[AuditLog]:
        ...

    async def save(self, audit_log: AuditLog) -> AuditLog:
        ...
