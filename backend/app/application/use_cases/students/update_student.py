"""
Use Case: Atualizar Aluno
=========================
Orquestra a atualização dos dados básicos (não-sensíveis) de um aluno.

[Clean Architecture v3] Usa AbstractUnitOfWork em vez de AsyncSession.
"""

import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.application.ports.student_repository import StudentRepository
from app.domain.exceptions import AlunoJaArquivadoError, AlunoNaoEncontradoError
from app.domain.models import Student


@dataclass
class UpdateStudentInput:
    student_id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID
    nome: Optional[str] = None
    data_nascimento: Optional[datetime] = None


class UpdateStudentUseCase:
    """Caso de uso para atualização dos dados básicos de um aluno.

    Aplica apenas campos não-sensíveis (nome, data_nascimento).
    Dados sensíveis (diagnóstico, laudo) têm endpoint e use case próprios.
    """

    def __init__(
        self,
        uow: AbstractUnitOfWork,
        student_repo: StudentRepository,
    ) -> None:
        self.uow = uow
        self.student_repo = student_repo

    async def execute(self, input_dto: UpdateStudentInput) -> Student:
        """Executa a atualização dentro de uma transação."""
        async with self.uow.transaction():
            student = await self.student_repo.get_by_id(input_dto.student_id)

            if not student or student.tenant_id != input_dto.tenant_id:
                raise AlunoNaoEncontradoError(input_dto.student_id)

            # Regra de negócio: entidade rica guarda a invariante
            if not student.pode_ser_editado():
                raise AlunoJaArquivadoError()

            if input_dto.nome is not None:
                student.nome = input_dto.nome
            if input_dto.data_nascimento is not None:
                student.data_nascimento = input_dto.data_nascimento

            student.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
            student.updated_by = input_dto.user_id

            return await self.student_repo.save(student)
