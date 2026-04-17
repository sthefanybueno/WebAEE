from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.student_history_repository import (
    StudentSchoolHistoryRepository,
)
from app.domain.entities.student_history import StudentSchoolHistory


class SQLModelStudentHistoryRepository(StudentSchoolHistoryRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, history: StudentSchoolHistory) -> StudentSchoolHistory:
        self._session.add(history)
        await self._session.flush()
        return history
