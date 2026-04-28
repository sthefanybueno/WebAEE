from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.student_history_repository import (
    StudentSchoolHistoryRepository,
)
from app.domain.entities.student_history import StudentSchoolHistory
from app.infrastructure.orm_models.student_history_orm import StudentSchoolHistoryORM


class SQLModelStudentHistoryRepository(StudentSchoolHistoryRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(self, history: StudentSchoolHistory) -> StudentSchoolHistory:
        orm = StudentSchoolHistoryORM(**history.model_dump())
        orm = await self._session.merge(orm)
        await self._session.flush()
        return StudentSchoolHistory(**orm.model_dump())
