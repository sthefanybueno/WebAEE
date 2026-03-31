from typing import Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.report_template_repository import (
    ReportTemplateRepository,
)
from app.domain.entities.report import ReportTemplate, TipoRelatorio


class SQLModelReportTemplateRepository(ReportTemplateRepository):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_active_by_tipo(
        self, tipo: TipoRelatorio
    ) -> Optional[ReportTemplate]:
        statement = select(ReportTemplate).where(
            ReportTemplate.tipo == tipo, ReportTemplate.ativo == True
        )
        result = await self.session.execute(statement)
        return result.scalars().first()
