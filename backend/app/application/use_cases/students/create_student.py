"""
Use Case: Criar Aluno
=====================
Orquestra o cadastro de novos alunos com conformidade LGPD.

[DDD v2] Chama entidade.registrar_consentimento_lgpd() em vez de
atribuir campos diretamente — a regra reside na entidade.

[Clean Architecture v3] Usa AbstractUnitOfWork em vez de AsyncSession —
o Use Case é agora totalmente agnóstico de banco de dados.
"""

import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.application.ports.school_repository import SchoolRepository
from app.application.ports.student_repository import StudentRepository
from app.domain.exceptions import (
    ConsentimentoLGPDAusenteError,
    EscolaNaoEncontradaError,
    TenantMismatchError,
)
from app.domain.models import StatusAluno, Student


def _to_naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Converte datetime timezone-aware para naive UTC."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


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
    """Caso de uso para matrícula de novos alunos com conformidade LGPD."""

    def __init__(
        self,
        uow: AbstractUnitOfWork,
        student_repo: StudentRepository,
        school_repo: SchoolRepository,
    ) -> None:
        self.uow = uow
        self.student_repo = student_repo
        self.school_repo = school_repo

    async def execute(self, input_dto: CreateStudentInput) -> Student:
        """Executa a criação do aluno dentro de uma transação."""
        async with self.uow.transaction():
            # Regra de negócio 1: consentimento é obrigatório
            if not input_dto.consentimento_lgpd:
                raise ConsentimentoLGPDAusenteError()

            # Regra de negócio 2: escola deve existir e pertencer ao tenant
            school = await self.school_repo.get_by_id(input_dto.escola_atual_id)
            if school is None:
                raise EscolaNaoEncontradaError(input_dto.escola_atual_id)
            if school.tenant_id != input_dto.tenant_id:
                raise TenantMismatchError("escola")

            # Cria a entidade e usa método rico para registrar consentimento
            student = Student(
                nome=input_dto.nome,
                tenant_id=input_dto.tenant_id,
                escola_atual_id=input_dto.escola_atual_id,
                data_nascimento=_to_naive_utc(input_dto.data_nascimento),
                diagnostico=input_dto.diagnostico,
                laudo=input_dto.laudo,
                status=StatusAluno.ATIVO.value,
            )

            # Método rico encapsula: flag + timestamp + base_legal juntos
            student.registrar_consentimento_lgpd(input_dto.base_legal)

            return await self.student_repo.save(student)
