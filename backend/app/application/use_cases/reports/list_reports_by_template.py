import uuid

from app.application.ports.report_repository import ReportRepository
from app.domain.entities.report import Report


class ListReportsByTemplateUseCase:
    def __init__(self, repository: ReportRepository) -> None:
        self.repository = repository

    async def execute(
        self, template_id: uuid.UUID
    ) -> list[Report]:
        """Recupera todos os relatórios de um template específico."""
        return await self.repository.list_by_template(template_id=template_id)
