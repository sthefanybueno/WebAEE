import uuid

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.notification_repository import NotificationRepository
from app.domain.entities.notification import Notification
from app.infrastructure.orm_models.notification_orm import NotificationORM


class SQLModelNotificationRepository(NotificationRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    @staticmethod
    def _to_entity(orm: NotificationORM) -> Notification:
        """Converte ORM model → entidade de domínio."""
        return Notification(**orm.model_dump())

    async def get_by_id(self, id: uuid.UUID) -> Notification | None:
        orm = await self._session.get(NotificationORM, id)
        return self._to_entity(orm) if orm else None

    async def list_by_tenant(self, tenant_id: uuid.UUID, apenas_nao_lidas: bool = False) -> list[Notification]:
        stmt = select(NotificationORM).where(NotificationORM.tenant_id == tenant_id)
        if apenas_nao_lidas:
            stmt = stmt.where(NotificationORM.lida == False)  # noqa: E712
        stmt = stmt.order_by(NotificationORM.created_at.desc())
        result = await self._session.exec(stmt)
        return [self._to_entity(orm) for orm in result.all()]

    async def save(self, notification: Notification) -> Notification:
        orm = NotificationORM(**notification.model_dump())
        orm = await self._session.merge(orm)
        await self._session.flush()
        return self._to_entity(orm)
