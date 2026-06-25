import uuid

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.report_repository import ReportRepository
from app.domain.entities.report import Report
from app.infrastructure.orm_models.report_orm import ReportORM


class SQLModelReportRepository(ReportRepository):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    @staticmethod
    def _to_entity(orm: ReportORM) -> Report:
        """Converte ORM model → entidade de domínio (Adaptador: persistência → domínio)."""
        return Report(**orm.model_dump())

    async def get_by_id(self, id: uuid.UUID) -> Report | None:
        orm = await self.session.get(ReportORM, id)
        return self._to_entity(orm) if orm else None

    async def list_by_student(
        self, student_id: uuid.UUID, template_id: uuid.UUID | None = None
    ) -> list[Report]:
        statement = select(ReportORM).where(ReportORM.aluno_id == student_id)
        if template_id:
            statement = statement.where(ReportORM.template_id == template_id)
        result = await self.session.exec(statement)
        return [self._to_entity(orm) for orm in result.all()]

    async def list_by_template(
        self, template_id: uuid.UUID
    ) -> list[Report]:
        statement = select(ReportORM).where(ReportORM.template_id == template_id)
        result = await self.session.exec(statement)
        return [self._to_entity(orm) for orm in result.all()]

    async def save(self, report: Report) -> Report:
        orm = ReportORM(**report.model_dump())
        orm = await self.session.merge(orm)
        await self.session.flush()
        return self._to_entity(orm)

