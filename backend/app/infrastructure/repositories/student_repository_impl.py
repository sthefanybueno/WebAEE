import uuid
from typing import List, Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.student_repository import StudentRepository
from app.domain.models import StatusAluno, Student


class SQLModelStudentRepository(StudentRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, id: uuid.UUID) -> Optional[Student]:
        return await self._session.get(Student, id)

    async def list_by_tenant(
        self, tenant_id: uuid.UUID, status: Optional[StatusAluno] = None
    ) -> List[Student]:
        stmt = select(Student).where(Student.tenant_id == tenant_id)
        if status is not None:
            # Pydantic / SQLModel: o campo pode ser str se acessado .value
            stmt = stmt.where(Student.status == status.value)  # type: ignore[attr-defined]

        result = await self._session.exec(stmt)
        return list(result.all())

    async def save(self, student: Student) -> Student:
        self._session.add(student)
        await self._session.flush()
        return student
