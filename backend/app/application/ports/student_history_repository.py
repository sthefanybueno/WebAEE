from typing import Protocol

from app.domain.entities.student_history import StudentSchoolHistory


class StudentSchoolHistoryRepository(Protocol):
    async def save(self, history: StudentSchoolHistory) -> StudentSchoolHistory:
        ...
