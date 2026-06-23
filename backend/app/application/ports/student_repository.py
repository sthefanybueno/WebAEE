import uuid
from typing import List, Optional, Protocol

from app.domain.models import StatusAluno, Student


class StudentRepository(Protocol):
    async def get_by_id(self, id: uuid.UUID, professor_id: Optional[uuid.UUID] = None) -> Optional[Student]:
        ...

    async def list_by_tenant(
        self, tenant_id: Optional[uuid.UUID], status: Optional[StatusAluno] = None, professor_id: Optional[uuid.UUID] = None, escola_id: Optional[uuid.UUID] = None
    ) -> List[Student]:
        ...

    async def save(self, student: Student) -> Student:
        ...

    async def delete(self, id: uuid.UUID) -> None:
        ...
