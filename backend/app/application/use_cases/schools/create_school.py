import uuid
from dataclasses import dataclass

from app.application.ports.school_repository import SchoolRepository
from app.domain.entities.school import School


@dataclass
class CreateSchoolInput:
    tenant_id: uuid.UUID
    nome: str


from sqlmodel.ext.asyncio.session import AsyncSession

class CreateSchoolUseCase:
    def __init__(self, session: AsyncSession, school_repo: SchoolRepository) -> None:
        self.session = session
        self.school_repo = school_repo

    async def execute(self, input_dto: CreateSchoolInput) -> School:
        async with self.session.begin():
            school = School(
                tenant_id=input_dto.tenant_id,
                nome=input_dto.nome,
            )
            return await self.school_repo.save(school)
