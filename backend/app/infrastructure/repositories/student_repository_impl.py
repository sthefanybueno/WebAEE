import uuid

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.student_repository import StudentRepository
from app.domain.models import StatusAluno, Student
from app.infrastructure.orm_models.professor_assignment_orm import ProfessorAssignmentORM
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

    async def get_by_id(self, id: uuid.UUID, professor_id: uuid.UUID | None = None) -> Student | None:
        if professor_id is None:
            orm = await self._session.get(StudentORM, id)
        else:
            stmt = select(StudentORM).join(
                ProfessorAssignmentORM, 
                StudentORM.id == ProfessorAssignmentORM.aluno_id
            ).where(
                StudentORM.id == id,
                ProfessorAssignmentORM.usuario_id == professor_id,
                ProfessorAssignmentORM.data_fim == None
            )
            result = await self._session.exec(stmt)
            orm = result.first()
            
        return self._to_entity(orm) if orm else None

    async def list_by_tenant(
        self, tenant_id: uuid.UUID | None, status: StatusAluno | None = None, professor_id: uuid.UUID | None = None, escola_id: uuid.UUID | None = None
    ) -> list[Student]:
        stmt = select(StudentORM).distinct()
        if tenant_id is not None:
            stmt = stmt.where(StudentORM.tenant_id == tenant_id)
        if status is not None:
            stmt = stmt.where(StudentORM.status == status.value)
        if escola_id is not None:
            stmt = stmt.where(StudentORM.escola_atual_id == escola_id)

        if professor_id is not None:
            stmt = stmt.join(
                ProfessorAssignmentORM, 
                StudentORM.id == ProfessorAssignmentORM.aluno_id
            ).where(
                ProfessorAssignmentORM.usuario_id == professor_id,
                ProfessorAssignmentORM.data_fim == None
            )

        result = await self._session.exec(stmt)
        return [self._to_entity(orm) for orm in result.all()]

    async def save(self, student: Student) -> Student:
        orm = StudentORM(**student.model_dump())
        orm = await self._session.merge(orm)
        await self._session.flush()
        return self._to_entity(orm)

    async def hard_delete(self, id: uuid.UUID) -> None:
        """Deleção física — chamada exclusivamente pelo DeleteStudentUseCase (ADMIN)."""
        orm = await self._session.get(StudentORM, id)
        if orm:
            await self._session.delete(orm)
            await self._session.flush()

