import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.infrastructure.database import get_session
from app.infrastructure.unit_of_work_impl import SQLAlchemyUnitOfWork
from app.infrastructure.repositories.schedule_repository_impl import SQLModelScheduleRepository

from app.domain.exceptions import DomainException
from app.application.use_cases.schedules.create_schedule import CreateScheduleUseCase, CreateScheduleInput, ConflitoHorarioError
from app.application.use_cases.schedules.list_schedules import ListSchedulesUseCase, ListSchedulesInput
from app.application.use_cases.schedules.delete_schedule import DeleteScheduleUseCase, DeleteScheduleInput

from app.interfaces.dependencies import CurrentUser, get_current_user
from app.interfaces.schemas.schedule import CreateScheduleRequest, ScheduleResponse

router = APIRouter(prefix="/api/agendas", tags=["agendas"])

def get_create_schedule_use_case(session: AsyncSession = Depends(get_session)) -> CreateScheduleUseCase:
    uow = SQLAlchemyUnitOfWork(session)
    return CreateScheduleUseCase(uow=uow, schedule_repo=SQLModelScheduleRepository(session))

def get_list_schedules_use_case(session: AsyncSession = Depends(get_session)) -> ListSchedulesUseCase:
    return ListSchedulesUseCase(schedule_repo=SQLModelScheduleRepository(session))

def get_delete_schedule_use_case(session: AsyncSession = Depends(get_session)) -> DeleteScheduleUseCase:
    uow = SQLAlchemyUnitOfWork(session)
    return DeleteScheduleUseCase(uow=uow, schedule_repo=SQLModelScheduleRepository(session))


@router.post("/", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    request: CreateScheduleRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: CreateScheduleUseCase = Depends(get_create_schedule_use_case),
):
    try:
        schedule = await use_case.execute(CreateScheduleInput(
            tenant_id=current_user.tenant_id,
            aluno_id=request.aluno_id,
            dia_semana=request.dia_semana,
            hora=request.hora,
            atividade=request.atividade,
            tipo_slot=request.tipo_slot,
            user_id=current_user.id
        ))
        return schedule
    except ConflitoHorarioError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=e.message) from e
    except DomainException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message) from e

@router.get("/", response_model=List[ScheduleResponse])
async def list_schedules(
    current_user: CurrentUser = Depends(get_current_user),
    use_case: ListSchedulesUseCase = Depends(get_list_schedules_use_case),
):
    schedules = await use_case.execute(ListSchedulesInput(tenant_id=current_user.tenant_id))
    return schedules

@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: DeleteScheduleUseCase = Depends(get_delete_schedule_use_case),
):
    await use_case.execute(DeleteScheduleInput(
        id=schedule_id,
        tenant_id=current_user.tenant_id
    ))
