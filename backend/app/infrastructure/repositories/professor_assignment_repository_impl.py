import uuid
from typing import List

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.professor_assignment_repository import (
    ProfessorAssignmentRepository,
)
from app.domain.entities.professor_assignment import ProfessorAssignment
from app.infrastructure.orm_models.professor_assignment_orm import ProfessorAssignmentORM


class SQLModelProfessorAssignmentRepository(ProfessorAssignmentRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_active_by_student(
        self, student_id: uuid.UUID
    ) -> List[ProfessorAssignment]:
        stmt = select(ProfessorAssignmentORM).where(
            ProfessorAssignmentORM.aluno_id == student_id,
            ProfessorAssignmentORM.data_fim == None,
        )
        result = await self._session.exec(stmt)
        return [ProfessorAssignment(**orm.model_dump()) for orm in result.all()]

    async def save(self, assignment: ProfessorAssignment) -> ProfessorAssignment:
        orm = ProfessorAssignmentORM(**assignment.model_dump())
        orm = await self._session.merge(orm)
        await self._session.flush()
        return ProfessorAssignment(**orm.model_dump())
