"""
Use Case: Deletar Aluno (Hard Delete — ADMIN only)
===================================================
Remoção física de aluno e todos os registros dependentes em transação atômica.
Uso restrito: apenas papel ADMIN, com auditoria obrigatória.

[Clean Architecture] Este Use Case viola a regra de não acessar infraestrutura
diretamente, mas o hard_delete de dependências (schedules, assignments, etc.)
é uma operação estruturalmente necessária que não tem abstração melhor sem
adicionar ports desnecessários para um Use Case raro e administrativo.

Esse acesso direto à sessão é aceitável APENAS aqui e está documentado.
"""
import uuid

from pydantic import BaseModel

# Imports de infraestrutura — justificativa: hard_delete em cascata de entidades
# relacionadas requer acesso direto à sessão. Isso é documentado e intencional.
from sqlmodel import select

from app.application.ports.student_repository import StudentRepository
from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.domain.entities.user import PapelUsuario
from app.domain.exceptions import AlunoNaoEncontradoError, PermissaoInsuficienteError
from app.infrastructure.orm_models.photo_orm import PhotoORM
from app.infrastructure.orm_models.professor_assignment_orm import ProfessorAssignmentORM
from app.infrastructure.orm_models.schedule_orm import ScheduleORM
from app.infrastructure.orm_models.student_history_orm import StudentSchoolHistoryORM


class DeleteStudentInput(BaseModel):
    """DTO de entrada para deleção física de aluno.

    Dado que o usuário autenticado possui papel ADMIN,
    Quando DeleteStudentUseCase.execute() é chamado,
    Então MUST remover o aluno e todos os registros dependentes de forma atômica.

    Dado que o papel não é ADMIN,
    Quando DeleteStudentUseCase.execute() é chamado,
    Então MUST lançar PermissaoInsuficienteError.
    """
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
        # Regra RBAC: apenas ADMIN pode deletar fisicamente
        if input_dto.papel != PapelUsuario.ADMIN:
            raise PermissaoInsuficienteError("deletar aluno", "admin")

        async with self._uow.transaction():
            student = await self._student_repo.get_by_id(input_dto.student_id)
            if not student or student.tenant_id != input_dto.tenant_id:
                raise AlunoNaoEncontradoError(input_dto.student_id)

            # Acesso direto à sessão — justificativa: remoção em cascata de ORM models.
            # Não existe port para deleção física em cascata por design.
            session = self._uow._session  # type: ignore

            schedules = await session.exec(select(ScheduleORM).where(ScheduleORM.aluno_id == student.id))
            for s in schedules:
                await session.delete(s)

            assignments = await session.exec(select(ProfessorAssignmentORM).where(ProfessorAssignmentORM.aluno_id == student.id))
            for a in assignments:
                await session.delete(a)

            histories = await session.exec(select(StudentSchoolHistoryORM).where(StudentSchoolHistoryORM.student_id == student.id))
            for h in histories:
                await session.delete(h)

            moments = await session.exec(select(PhotoORM).where(PhotoORM.aluno_id == student.id))
            for m in moments:
                await session.delete(m)

            await self._student_repo.hard_delete(student.id)
