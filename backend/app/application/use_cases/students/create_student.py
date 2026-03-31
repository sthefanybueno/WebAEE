import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from app.application.ports.school_repository import SchoolRepository
from app.application.ports.student_repository import StudentRepository
from app.domain.models import StatusAluno, Student


@dataclass
class CreateStudentInput:
    nome: str
    tenant_id: uuid.UUID
    escola_atual_id: uuid.UUID
    consentimento_lgpd: bool
    data_nascimento: Optional[datetime] = None
    diagnostico: Optional[str] = None
    laudo: Optional[str] = None
    base_legal: str = "Art. 58 LDB"


class CreateStudentUseCase:
    def __init__(
        self, student_repo: StudentRepository, school_repo: SchoolRepository
    ) -> None:
        self.student_repo = student_repo
        self.school_repo = school_repo

    async def execute(self, input_dto: CreateStudentInput) -> Student:
        if not input_dto.consentimento_lgpd:
            raise ValueError("consentimento_lgpd DEVE ser True para criar um aluno.")

        school = await self.school_repo.get_by_id(input_dto.escola_atual_id)
        if not school or school.tenant_id != input_dto.tenant_id:
            raise ValueError("Escola não encontrada ou pertence a outro tenant.")

        student = Student(
            nome=input_dto.nome,
            tenant_id=input_dto.tenant_id,
            escola_atual_id=input_dto.escola_atual_id,
            consentimento_lgpd=True,
            data_consentimento=datetime.now(timezone.utc).replace(tzinfo=None),
            base_legal=input_dto.base_legal,
            data_nascimento=input_dto.data_nascimento,
            diagnostico=input_dto.diagnostico,
            laudo=input_dto.laudo,
            status=StatusAluno.ATIVO.value,
        )

        return await self.student_repo.save(student)
