import uuid
from dataclasses import dataclass

from app.application.ports.schedule_repository import ScheduleRepository
from app.application.ports.unit_of_work import AbstractUnitOfWork


@dataclass
class DeleteScheduleInput:
    id: uuid.UUID
    tenant_id: uuid.UUID

class DeleteScheduleUseCase:
    def __init__(self, uow: AbstractUnitOfWork, schedule_repo: ScheduleRepository):
        self._uow = uow
        self._schedule_repo = schedule_repo

    async def execute(self, input_dto: DeleteScheduleInput) -> None:
        async with self._uow.transaction():
            schedule = await self._schedule_repo.get_by_id(input_dto.id)
            if schedule and schedule.tenant_id == input_dto.tenant_id:
                await self._schedule_repo.delete(input_dto.id)
