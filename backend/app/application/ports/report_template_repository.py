from typing import List, Optional, Protocol

from app.domain.entities.report import ReportTemplate, TipoRelatorio


class ReportTemplateRepository(Protocol):
    async def get_active_by_tipo(
        self, tipo: TipoRelatorio
    ) -> Optional[ReportTemplate]:
        ...

    async def list_all(self) -> List[ReportTemplate]:
        """Retorna todos os templates ativos do sistema."""
        ...
