import uuid
from typing import List, Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.schedule_repository import ScheduleRepository
from app.domain.entities.schedule import Schedule
from app.infrastructure.orm_models.schedule_orm import ScheduleORM

class SQLModelScheduleRepository(ScheduleRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    @staticmethod
    def _to_entity(orm: ScheduleORM) -> Schedule:
        return Schedule(**orm.model_dump())

    async def get_by_id(self, id: uuid.UUID) -> Optional[Schedule]:
        orm = await self._session.get(ScheduleORM, id)
        return self._to_entity(orm) if orm else None

    async def list_by_tenant(self, tenant_id: uuid.UUID) -> List[Schedule]:
        stmt = select(ScheduleORM).where(ScheduleORM.tenant_id == tenant_id)
        result = await self._session.exec(stmt)
        return [self._to_entity(orm) for orm in result.all()]

    async def save(self, schedule: Schedule) -> Schedule:
        orm = ScheduleORM(**schedule.model_dump())
        orm = await self._session.merge(orm)
        await self._session.flush()
        return self._to_entity(orm)

    async def delete(self, id: uuid.UUID) -> None:
        orm = await self._session.get(ScheduleORM, id)
        if orm:
            await self._session.delete(orm)
            await self._session.flush()
