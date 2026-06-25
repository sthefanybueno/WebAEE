import uuid
from typing import Protocol

from app.domain.entities.school import School


class SchoolRepository(Protocol):
    async def get_by_id(self, id: uuid.UUID) -> School | None:
        ...
        
    async def save(self, school: School) -> School:
        ...

    async def list_by_tenant(self, tenant_id: uuid.UUID) -> list[School]:
        ...
