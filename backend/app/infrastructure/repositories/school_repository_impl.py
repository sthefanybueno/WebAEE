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
