import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from app.application.ports.professor_assignment_repository import (
    ProfessorAssignmentRepository,
)
from app.application.ports.school_repository import SchoolRepository
from app.application.ports.student_history_repository import (
    StudentSchoolHistoryRepository,
)
from app.application.ports.student_repository import StudentRepository
from app.domain.entities.student_history import StudentSchoolHistory
from app.domain.models import Student


@dataclass
class TransferStudentInput:
    student_id: uuid.UUID
    nova_escola_id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID


class TransferStudentUseCase:
    def __init__(
        self,
        student_repo: StudentRepository,
        school_repo: SchoolRepository,
        assignment_repo: ProfessorAssignmentRepository,
        history_repo: StudentSchoolHistoryRepository,
    ) -> None:
        self.student_repo = student_repo
        self.school_repo = school_repo
        self.assignment_repo = assignment_repo
        self.history_repo = history_repo

    async def execute(self, input_dto: TransferStudentInput) -> Student:
        student = await self.student_repo.get_by_id(input_dto.student_id)
        if not student or student.tenant_id != input_dto.tenant_id:
            raise ValueError("Aluno não encontrado ou não pertence a este tenant.")

        nova_escola = await self.school_repo.get_by_id(input_dto.nova_escola_id)
        if not nova_escola or nova_escola.tenant_id != input_dto.tenant_id:
            raise ValueError("Nova escola não encontrada ou pertence a outro tenant.")

        # Revogar acessos dos professores atuais
        active_assignments = await self.assignment_repo.list_active_by_student(
            input_dto.student_id
        )
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        for assignment in active_assignments:
            assignment.data_fim = now
            await self.assignment_repo.save(assignment)

        # Atualizar a escola do aluno
        student.escola_atual_id = input_dto.nova_escola_id
        student.updated_at = now
        student.updated_by = input_dto.user_id
        saved_student = await self.student_repo.save(student)

        # Salvar histórico
        history = StudentSchoolHistory(
            student_id=input_dto.student_id,
            school_id=input_dto.nova_escola_id,
            user_id=input_dto.user_id,
            transfer_date=now,
        )
        await self.history_repo.save(history)

        return saved_student
