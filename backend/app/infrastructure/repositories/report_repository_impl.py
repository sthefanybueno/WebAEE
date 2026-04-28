import uuid
from typing import List, Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.report_repository import ReportRepository
from app.domain.entities.report import Report, TipoRelatorio
from app.infrastructure.orm_models.report_orm import ReportORM

class SQLModelReportRepository(ReportRepository):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, id: uuid.UUID) -> Optional[Report]:
        orm = await self.session.get(ReportORM, id)
        if orm:
            return Report(**orm.model_dump())
        return None

    async def list_by_student(
        self, student_id: uuid.UUID, tipo: Optional[TipoRelatorio] = None
    ) -> List[Report]:
        statement = select(ReportORM).where(ReportORM.aluno_id == student_id)
        if tipo:
            statement = statement.where(ReportORM.tipo == tipo)
        result = await self.session.exec(statement)
        return [Report(**orm.model_dump()) for orm in result.all()]

    async def save(self, report: Report) -> Report:
        orm = ReportORM(**report.model_dump())
        orm = await self.session.merge(orm)
        await self.session.flush()
        return Report(**orm.model_dump())
