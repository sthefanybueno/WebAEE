import uuid
from typing import List

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.audit_log_repository import AuditLogRepository
from app.domain.entities.audit_log import AuditLog


class SQLModelAuditLogRepository(AuditLogRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_student(self, student_id: uuid.UUID) -> List[AuditLog]:
        stmt = select(AuditLog).where(AuditLog.student_id == student_id)
        result = await self._session.exec(stmt)
        return list(result.all())

    async def save(self, audit_log: AuditLog) -> AuditLog:
        self._session.add(audit_log)
        await self._session.commit()
        await self._session.refresh(audit_log)
        return audit_log
