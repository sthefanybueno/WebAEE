import uuid
from typing import List

from app.application.ports.school_repository import SchoolRepository
from app.domain.entities.school import School


from sqlmodel.ext.asyncio.session import AsyncSession

class ListSchoolsUseCase:
    def __init__(self, session: AsyncSession, school_repo: SchoolRepository) -> None:
        self.session = session
        self.school_repo = school_repo

    async def execute(self, tenant_id: uuid.UUID) -> List[School]:
        return await self.school_repo.list_by_tenant(tenant_id)
