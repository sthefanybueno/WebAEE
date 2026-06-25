import uuid

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.report_template_repository import (
    ReportTemplateRepository,
)
from app.domain.entities.report import ReportTemplate
from app.infrastructure.orm_models.report_orm import ReportTemplateORM


class SQLModelReportTemplateRepository(ReportTemplateRepository):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, template_id: uuid.UUID) -> ReportTemplate | None:
        statement = select(ReportTemplateORM).where(
            ReportTemplateORM.id == template_id, ReportTemplateORM.ativo == True
        )
        result = await self.session.exec(statement)
        orm = result.first()
        if orm:
            return ReportTemplate(**orm.model_dump())
        return None

    async def list_all(self) -> list[ReportTemplate]:
        """Retorna todos os templates do sistema (ativos e inativos)."""
        statement = select(ReportTemplateORM)
        result = await self.session.exec(statement)
        return [ReportTemplate(**orm.model_dump()) for orm in result.all()]

    async def save(self, template: ReportTemplate) -> ReportTemplate:
        orm = ReportTemplateORM(**template.model_dump())
        self.session.add(orm)
        await self.session.flush()
        await self.session.refresh(orm)
        return ReportTemplate(**orm.model_dump())
