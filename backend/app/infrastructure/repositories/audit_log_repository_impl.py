import uuid

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.audit_log_repository import AuditLogRepository
from app.domain.entities.audit_log import AuditLog
from app.infrastructure.orm_models.audit_log_orm import AuditLogORM


class SQLModelAuditLogRepository(AuditLogRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_student(self, student_id: uuid.UUID) -> list[AuditLog]:
        stmt = select(AuditLogORM).where(AuditLogORM.student_id == student_id)
        result = await self._session.exec(stmt)
        return [AuditLog(**orm.model_dump()) for orm in result.all()]

    async def save(self, audit_log: AuditLog) -> AuditLog:
        orm = AuditLogORM(**audit_log.model_dump())
        orm = await self._session.merge(orm)
        await self._session.flush()
        return AuditLog(**orm.model_dump())
