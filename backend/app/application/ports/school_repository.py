import uuid
from typing import Optional, Protocol

from app.domain.entities.school import School


class SchoolRepository(Protocol):
    async def get_by_id(self, id: uuid.UUID) -> Optional[School]:
        ...
