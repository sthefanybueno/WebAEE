import uuid
from typing import Protocol

from app.domain.entities.report import ReportTemplate


class ReportTemplateRepository(Protocol):
    async def get_by_id(self, template_id: uuid.UUID) -> ReportTemplate | None:
        ...

    async def list_all(self) -> list[ReportTemplate]:
        """Retorna todos os templates do sistema."""
        ...

    async def save(self, template: ReportTemplate) -> ReportTemplate:
        ...
