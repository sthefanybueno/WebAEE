import uuid
from typing import Protocol

from app.domain.entities.report import Report


class ReportRepository(Protocol):
    async def get_by_id(self, id: uuid.UUID) -> Report | None:
        ...

    async def list_by_student(
        self, student_id: uuid.UUID, template_id: uuid.UUID | None = None
    ) -> list[Report]:
        ...

    async def list_by_template(
        self, template_id: uuid.UUID
    ) -> list[Report]:
        ...

    async def save(self, report: Report) -> Report:
        ...
