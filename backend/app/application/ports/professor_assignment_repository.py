import uuid
from typing import Protocol

from app.domain.entities.professor_assignment import ProfessorAssignment


class ProfessorAssignmentRepository(Protocol):
    async def list_active_by_student(
        self, student_id: uuid.UUID
    ) -> list[ProfessorAssignment]:
        ...

    async def list_active_by_user(
        self, user_id: uuid.UUID
    ) -> list[ProfessorAssignment]:
        ...

    async def save(
        self, assignment: ProfessorAssignment
    ) -> ProfessorAssignment:
        ...
