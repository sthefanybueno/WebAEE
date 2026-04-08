import uuid
from typing import Optional

from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.school_repository import SchoolRepository
from app.domain.entities.school import School


class SQLModelSchoolRepository(SchoolRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, id: uuid.UUID) -> Optional[School]:
        return await self._session.get(School, id)

    async def save(self, school: School) -> School:
        self._session.add(school)
        await self._session.commit()
        await self._session.refresh(school)
        return school

    async def list_by_tenant(self, tenant_id: uuid.UUID) -> list[School]:
        from sqlmodel import select
        from app.domain.entities.school import School as SchoolModel
        statement = select(SchoolModel).where(SchoolModel.tenant_id == tenant_id)
        result = await self._session.execute(statement)
        schools = result.scalars().all()
        return list(schools)
