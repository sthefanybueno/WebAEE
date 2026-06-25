import uuid

from app.application.ports.school_repository import SchoolRepository
from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.domain.entities.school import School


class ListSchoolsUseCase:
    def __init__(self, uow: AbstractUnitOfWork, school_repo: SchoolRepository) -> None:
        self.uow = uow
        self.school_repo = school_repo

    async def execute(self, tenant_id: uuid.UUID) -> list[School]:
        return await self.school_repo.list_by_tenant(tenant_id)
