import uuid
from typing import List, Optional, Protocol

from app.domain.models import StatusAluno, Student


class StudentRepository(Protocol):
    async def get_by_id(self, id: uuid.UUID) -> Optional[Student]:
        ...

    async def list_by_tenant(
        self, tenant_id: uuid.UUID, status: Optional[StatusAluno] = None
    ) -> List[Student]:
        ...

    async def save(self, student: Student) -> Student:
        ...
