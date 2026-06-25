import uuid
from dataclasses import dataclass

from app.application.ports.schedule_repository import ScheduleRepository
from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.domain.entities.schedule import Schedule
from app.domain.exceptions import DomainException


class ConflitoHorarioError(DomainException):
    def __init__(self, message="Já existe um atendimento neste horário para este dia."):
        super().__init__(message)

@dataclass
class CreateScheduleInput:
    tenant_id: uuid.UUID
    aluno_id: uuid.UUID
    dia_semana: str
    hora: str
    atividade: str
    tipo_slot: str
    user_id: uuid.UUID

class CreateScheduleUseCase:
    def __init__(self, uow: AbstractUnitOfWork, schedule_repo: ScheduleRepository):
        self._uow = uow
        self._schedule_repo = schedule_repo

    async def execute(self, input_dto: CreateScheduleInput) -> Schedule:
        async with self._uow.transaction():
            # Check conflict
            schedules = await self._schedule_repo.list_by_tenant(input_dto.tenant_id)
            for s in schedules:
                if s.dia_semana == input_dto.dia_semana and s.hora == input_dto.hora:
                    raise ConflitoHorarioError()

            schedule = Schedule(
                tenant_id=input_dto.tenant_id,
                aluno_id=input_dto.aluno_id,
                dia_semana=input_dto.dia_semana,
                hora=input_dto.hora,
                atividade=input_dto.atividade,
                tipo_slot=input_dto.tipo_slot,
                aee_id=input_dto.user_id,
                created_by=input_dto.user_id
            )

            schedule = await self._schedule_repo.save(schedule)

        return schedule
