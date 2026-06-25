import uuid
from dataclasses import dataclass
from typing import Any

from app.application.ports.report_repository import ReportRepository
from app.application.ports.student_repository import StudentRepository
from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.domain.entities.report import Report
from app.domain.exceptions import (
    RelatorioNaoEncontradoError,
    RelatorioTravadoError,
)


@dataclass
class UpdateReportInput:
    report_id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID
    conteudo_json: dict[str, Any]


class UpdateReportUseCase:
    """Caso de uso para atualizar um relatório (apenas os dados).
    Garante isolamento de tenant.
    """

    def __init__(
        self,
        uow: AbstractUnitOfWork,
        report_repo: ReportRepository,
        student_repo: StudentRepository,
    ) -> None:
        self.uow = uow
        self.report_repo = report_repo
        self.student_repo = student_repo

    async def execute(self, input_dto: UpdateReportInput) -> Report:
        async with self.uow.transaction():
            report = await self.report_repo.get_by_id(input_dto.report_id)
            if not report:
                raise RelatorioNaoEncontradoError(input_dto.report_id)

            student = await self.student_repo.get_by_id(report.aluno_id)
            if not student or student.tenant_id != input_dto.tenant_id:
                raise RelatorioNaoEncontradoError(input_dto.report_id)

            if not report.pode_ser_editado():
                raise RelatorioTravadoError()

            # Método rico encapsula: validação de estado + conteúdo + updated_by + updated_at
            report.atualizar_conteudo(input_dto.conteudo_json, input_dto.user_id)

            return await self.report_repo.save(report)
