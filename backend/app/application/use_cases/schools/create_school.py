import uuid
from dataclasses import dataclass

from app.application.ports.school_repository import SchoolRepository
from app.domain.entities.school import School


@dataclass
class CreateSchoolInput:
    tenant_id: uuid.UUID
    nome: str


from app.application.ports.unit_of_work import AbstractUnitOfWork

class CreateSchoolUseCase:
    def __init__(self, uow: AbstractUnitOfWork, school_repo: SchoolRepository) -> None:
        self.uow = uow
        self.school_repo = school_repo

    async def execute(self, input_dto: CreateSchoolInput) -> School:
        async with self.uow.transaction():
            school = School(
                tenant_id=input_dto.tenant_id,
                nome=input_dto.nome,
            )
            return await self.school_repo.save(school)
