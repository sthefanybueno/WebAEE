import uuid
from typing import List, Optional, Protocol

from app.domain.entities.report import Report, TipoRelatorio


class ReportRepository(Protocol):
    async def get_by_id(self, id: uuid.UUID) -> Optional[Report]:
        ...

    async def list_by_student(
        self, student_id: uuid.UUID, tipo: Optional[TipoRelatorio] = None
    ) -> List[Report]:
        ...

    async def save(self, report: Report) -> Report:
        ...
