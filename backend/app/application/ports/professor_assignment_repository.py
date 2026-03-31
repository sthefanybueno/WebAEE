import uuid
from typing import List, Protocol

from app.domain.entities.professor_assignment import ProfessorAssignment


class ProfessorAssignmentRepository(Protocol):
    async def list_active_by_student(
        self, student_id: uuid.UUID
    ) -> List[ProfessorAssignment]:
        ...

    async def save(
        self, assignment: ProfessorAssignment
    ) -> ProfessorAssignment:
        ...
