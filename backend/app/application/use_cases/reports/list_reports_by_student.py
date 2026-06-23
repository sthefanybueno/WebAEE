"""
Use Case: Listar Relatórios por Aluno
======================================
Encapsula a verificação de tenant e a delegação ao repositório,
eliminando o acoplamento de repositório e o vazamento de lógica
que existia diretamente no Router.

[DDD] Toda verificação de isolamento multi-tenant reside aqui —
o Router apenas monta o DTO e traduz a DomainException em HTTP.
[Clean Architecture] Este UC é agnóstico de banco; recebe ports abstratos.
"""

import uuid
from dataclasses import dataclass
from typing import List, Optional

from app.application.ports.report_repository import ReportRepository
from app.application.ports.student_repository import StudentRepository
from app.domain.entities.report import Report
from app.domain.exceptions import AlunoNaoEncontradoError, TenantMismatchError


@dataclass
class ListReportsByStudentInput:
    student_id: uuid.UUID
    tenant_id: uuid.UUID
    template_id: Optional[uuid.UUID] = None


class ListReportsByStudentUseCase:
    """Caso de uso para listar relatórios de um aluno com verificação de tenant.

    Garante que:
    1. O aluno exista no sistema.
    2. O aluno pertença ao mesmo tenant do usuário logado (isolamento multi-tenant).
    3. A listagem retorne apenas relatórios do tipo solicitado (filtro opcional).
    """

    def __init__(
        self,
        report_repo: ReportRepository,
        student_repo: StudentRepository,
    ) -> None:
        self.report_repo = report_repo
        self.student_repo = student_repo

    async def execute(self, input_dto: ListReportsByStudentInput) -> List[Report]:
        """Valida tenant e retorna relatórios do aluno.

        Raises:
            AlunoNaoEncontradoError: se o aluno não existir no sistema.
            TenantMismatchError: se o aluno pertencer a um tenant diferente.
        """
        student = await self.student_repo.get_by_id(input_dto.student_id)
        if student is None:
            raise AlunoNaoEncontradoError(input_dto.student_id)
        if student.tenant_id != input_dto.tenant_id:
            raise TenantMismatchError("aluno")

        return await self.report_repo.list_by_student(input_dto.student_id, input_dto.template_id)
