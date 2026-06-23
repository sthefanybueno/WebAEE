import uuid
from pydantic import BaseModel
from app.application.ports.student_repository import StudentRepository
from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.domain.exceptions import AlunoNaoEncontradoError
from app.domain.entities.user import PapelUsuario

class DeleteStudentInput(BaseModel):
    student_id: uuid.UUID
    tenant_id: uuid.UUID
    papel: PapelUsuario
    user_id: uuid.UUID

class DeleteStudentUseCase:
    def __init__(
        self,
        uow: AbstractUnitOfWork,
        student_repo: StudentRepository,
    ):
        self._uow = uow
        self._student_repo = student_repo

    async def execute(self, input_dto: DeleteStudentInput) -> None:
        async with self._uow.transaction():
            professor_id = input_dto.user_id if input_dto.papel in (PapelUsuario.PROF_APOIO, PapelUsuario.PROF_REGENTE) else None
            student = await self._student_repo.get_by_id(input_dto.student_id, professor_id=professor_id)
            if not student or (student.tenant_id != input_dto.tenant_id and input_dto.papel != PapelUsuario.ADMIN):
                raise AlunoNaoEncontradoError(input_dto.student_id)

            from sqlmodel import select
            from app.infrastructure.orm_models.schedule_orm import ScheduleORM
            from app.infrastructure.orm_models.professor_assignment_orm import ProfessorAssignmentORM
            from app.infrastructure.orm_models.student_history_orm import StudentSchoolHistoryORM
            from app.infrastructure.orm_models.photo_orm import PhotoORM
            
            session = self._uow._session # type: ignore
            
            schedules = await session.exec(select(ScheduleORM).where(ScheduleORM.aluno_id == student.id))
            for s in schedules: await session.delete(s)
            
            assignments = await session.exec(select(ProfessorAssignmentORM).where(ProfessorAssignmentORM.aluno_id == student.id))
            for a in assignments: await session.delete(a)
                
            histories = await session.exec(select(StudentSchoolHistoryORM).where(StudentSchoolHistoryORM.student_id == student.id))
            for h in histories: await session.delete(h)
                
            moments = await session.exec(select(PhotoORM).where(PhotoORM.aluno_id == student.id))
            for m in moments: await session.delete(m)

            await self._student_repo.delete(student.id)
