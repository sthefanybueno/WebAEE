import uuid
from typing import List, Optional, Protocol

from app.domain.entities.report import Report


class ReportRepository(Protocol):
    async def get_by_id(self, id: uuid.UUID) -> Optional[Report]:
        ...

    async def list_by_student(
        self, student_id: uuid.UUID, template_id: Optional[uuid.UUID] = None
    ) -> List[Report]:
        ...

    async def list_by_template(
        self, template_id: uuid.UUID
    ) -> List[Report]:
        ...

    async def save(self, report: Report) -> Report:
        ...
