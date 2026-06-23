import uuid
from typing import List, Optional
from typing import Protocol

from app.domain.entities.schedule import Schedule

class ScheduleRepository(Protocol):
    async def get_by_id(self, id: uuid.UUID) -> Optional[Schedule]:
        ...

    async def list_by_tenant(self, tenant_id: uuid.UUID) -> List[Schedule]:
        ...

    async def save(self, schedule: Schedule) -> Schedule:
        ...

    async def delete(self, id: uuid.UUID) -> None:
        ...
