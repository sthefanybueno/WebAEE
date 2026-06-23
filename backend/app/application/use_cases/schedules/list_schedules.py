import uuid
from dataclasses import dataclass
from typing import List

from app.application.ports.schedule_repository import ScheduleRepository
from app.domain.entities.schedule import Schedule

@dataclass
class ListSchedulesInput:
    tenant_id: uuid.UUID

class ListSchedulesUseCase:
    def __init__(self, schedule_repo: ScheduleRepository):
        self._schedule_repo = schedule_repo

    async def execute(self, input_dto: ListSchedulesInput) -> List[Schedule]:
        return await self._schedule_repo.list_by_tenant(input_dto.tenant_id)
