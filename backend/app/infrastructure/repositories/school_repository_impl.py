import uuid
from typing import Optional

from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.school_repository import SchoolRepository
from app.domain.entities.school import School
from app.infrastructure.orm_models.school_orm import SchoolORM

class SQLModelSchoolRepository(SchoolRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, id: uuid.UUID) -> Optional[School]:
        orm = await self._session.get(SchoolORM, id)
        if orm:
            return School(**orm.model_dump())
        return None

    async def save(self, school: School) -> School:
        orm = SchoolORM(**school.model_dump())
        orm = await self._session.merge(orm)
        await self._session.flush()
        return School(**orm.model_dump())

    async def list_by_tenant(self, tenant_id: uuid.UUID) -> list[School]:
        from sqlmodel import select
        statement = select(SchoolORM).where(SchoolORM.tenant_id == tenant_id)
        result = await self._session.exec(statement)
        return [School(**orm.model_dump()) for orm in result.all()]
