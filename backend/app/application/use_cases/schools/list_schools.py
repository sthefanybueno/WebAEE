import uuid
from typing import List

from app.application.ports.school_repository import SchoolRepository
from app.domain.entities.school import School


from app.application.ports.unit_of_work import AbstractUnitOfWork

class ListSchoolsUseCase:
    def __init__(self, uow: AbstractUnitOfWork, school_repo: SchoolRepository) -> None:
        self.uow = uow
        self.school_repo = school_repo

    async def execute(self, tenant_id: uuid.UUID) -> List[School]:
        return await self.school_repo.list_by_tenant(tenant_id)
