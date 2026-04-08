import uuid
from typing import Optional, Protocol

from app.domain.entities.school import School


class SchoolRepository(Protocol):
    async def get_by_id(self, id: uuid.UUID) -> Optional[School]:
        ...
        
    async def save(self, school: School) -> School:
        ...

    async def list_by_tenant(self, tenant_id: uuid.UUID) -> list[School]:
        ...
