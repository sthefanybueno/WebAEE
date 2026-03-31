import uuid
from typing import List

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.professor_assignment_repository import (
    ProfessorAssignmentRepository,
)
from app.domain.entities.professor_assignment import ProfessorAssignment


class SQLModelProfessorAssignmentRepository(ProfessorAssignmentRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_active_by_student(
        self, student_id: uuid.UUID
    ) -> List[ProfessorAssignment]:
        stmt = select(ProfessorAssignment).where(
            ProfessorAssignment.aluno_id == student_id,
            ProfessorAssignment.data_fim == None,
        )
        result = await self._session.exec(stmt)
        return list(result.all())

    async def save(self, assignment: ProfessorAssignment) -> ProfessorAssignment:
        self._session.add(assignment)
        await self._session.commit()
        await self._session.refresh(assignment)
        return assignment
