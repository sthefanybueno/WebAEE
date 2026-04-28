from typing import Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.report_template_repository import (
    ReportTemplateRepository,
)
from app.domain.entities.report import ReportTemplate, TipoRelatorio
from app.infrastructure.orm_models.report_orm import ReportTemplateORM


class SQLModelReportTemplateRepository(ReportTemplateRepository):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_active_by_tipo(
        self, tipo: TipoRelatorio
    ) -> Optional[ReportTemplate]:
        statement = select(ReportTemplateORM).where(
            ReportTemplateORM.tipo == tipo, ReportTemplateORM.ativo == True
        )
        result = await self.session.exec(statement)
        orm = result.first()
        if orm:
            return ReportTemplate(**orm.model_dump())
        return None
