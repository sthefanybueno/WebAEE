from typing import Optional, Protocol

from app.domain.entities.report import ReportTemplate, TipoRelatorio


class ReportTemplateRepository(Protocol):
    async def get_active_by_tipo(
        self, tipo: TipoRelatorio
    ) -> Optional[ReportTemplate]:
        ...
