import uuid
from typing import List, Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.student_repository import StudentRepository
from app.domain.models import StatusAluno, Student
from app.infrastructure.orm_models.student_orm import StudentORM


class SQLModelStudentRepository(StudentRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    @staticmethod
    def _to_entity(orm: StudentORM) -> Student:
        """Converte ORM model → entidade de domínio (Adaptador: persistência → domínio).

        [DDD] Centraliza o mapeamento. Qualquer divergência futura entre
        a estrutura do banco e a entidade é resolvida aqui, não nos métodos.
        """
        return Student(**orm.model_dump())

    async def get_by_id(self, id: uuid.UUID) -> Optional[Student]:
        orm = await self._session.get(StudentORM, id)
        return self._to_entity(orm) if orm else None

    async def list_by_tenant(
        self, tenant_id: uuid.UUID, status: Optional[StatusAluno] = None
    ) -> List[Student]:
        stmt = select(StudentORM).where(StudentORM.tenant_id == tenant_id)
        if status is not None:
            stmt = stmt.where(StudentORM.status == status.value)

        result = await self._session.exec(stmt)
        return [self._to_entity(orm) for orm in result.all()]

    async def save(self, student: Student) -> Student:
        orm = StudentORM(**student.model_dump())
        orm = await self._session.merge(orm)
        await self._session.flush()
        return self._to_entity(orm)

