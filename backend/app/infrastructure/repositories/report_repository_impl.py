import uuid
from typing import List, Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.report_repository import ReportRepository
from app.domain.entities.report import Report, TipoRelatorio


class SQLModelReportRepository(ReportRepository):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, id: uuid.UUID) -> Optional[Report]:
        return await self.session.get(Report, id)

    async def list_by_student(
        self, student_id: uuid.UUID, tipo: Optional[TipoRelatorio] = None
    ) -> List[Report]:
        statement = select(Report).where(Report.aluno_id == student_id)
        if tipo:
            statement = statement.where(Report.tipo == tipo)
        result = await self.session.execute(statement)
        return list(result.scalars().all())

    async def save(self, report: Report) -> Report:
        self.session.add(report)
        await self.session.commit()
        await self.session.refresh(report)
        return report
