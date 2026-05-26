"""
Use Case: Obter Aluno por ID
=============================
Consulta os dados detalhados de um aluno específico.

Extraído do endpoint GET /api/alunos/{id} que instanciava repositório
diretamente no Router e validava tenant_id lá — violação crítica.
"""

import uuid
from dataclasses import dataclass

from app.application.ports.student_repository import StudentRepository
from app.domain.exceptions import AlunoNaoEncontradoError, TenantMismatchError
from app.domain.models import Student


@dataclass
class GetStudentInput:
    student_id: uuid.UUID
    tenant_id: uuid.UUID


class GetStudentUseCase:
    """Caso de uso para obter detalhes de um aluno, garantindo isolamento de tenant."""

    def __init__(self, student_repo: StudentRepository) -> None:
        self.student_repo = student_repo

    async def execute(self, input_dto: GetStudentInput) -> Student:
        """Retorna o aluno se existir e pertencer ao tenant do executor.

        Raises:
            AlunoNaoEncontradoError: se o aluno não existir.
            TenantMismatchError: se o aluno pertencer a outro tenant.
        """
        student = await self.student_repo.get_by_id(input_dto.student_id)
        if student is None:
            raise AlunoNaoEncontradoError(input_dto.student_id)
        if student.tenant_id != input_dto.tenant_id:
            raise TenantMismatchError("aluno")
        return student
