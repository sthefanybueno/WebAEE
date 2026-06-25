import uuid
from dataclasses import dataclass

from app.application.ports.report_repository import ReportRepository
from app.application.ports.student_repository import StudentRepository
from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.domain.entities.report import Report
from app.domain.exceptions import RelatorioNaoEncontradoError


@dataclass
class GetReportDetailInput:
    report_id: uuid.UUID
    tenant_id: uuid.UUID


class GetReportDetailUseCase:
    """Caso de uso para consultar os detalhes de um relatório garantindo
    isolamento de tenant através do aluno vinculado.
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

    async def execute(self, input_dto: GetReportDetailInput) -> Report:
        report = await self.report_repo.get_by_id(input_dto.report_id)
        if not report:
            raise RelatorioNaoEncontradoError(input_dto.report_id)

        student = await self.student_repo.get_by_id(report.aluno_id)
        if not student or student.tenant_id != input_dto.tenant_id:
            # Ocultamos a existência se o aluno não for do tenant
            raise RelatorioNaoEncontradoError(input_dto.report_id)

        return report
