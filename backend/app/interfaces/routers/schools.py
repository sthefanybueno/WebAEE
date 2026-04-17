import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.use_cases.schools.create_school import (
    CreateSchoolInput,
    CreateSchoolUseCase,
)
from app.application.use_cases.schools.list_schools import ListSchoolsUseCase
from app.infrastructure.database import get_session
from app.infrastructure.repositories.school_repository_impl import (
    SQLModelSchoolRepository,
)
from app.interfaces.dependencies import CurrentUser, get_current_user
from app.interfaces.schemas.school import CreateSchoolRequest, SchoolResponse

router = APIRouter(prefix="/api/escolas", tags=["escolas"])

def get_create_school_use_case(session: AsyncSession = Depends(get_session)) -> CreateSchoolUseCase:
    return CreateSchoolUseCase(session=session, school_repo=SQLModelSchoolRepository(session))

def get_list_schools_use_case(session: AsyncSession = Depends(get_session)) -> ListSchoolsUseCase:
    return ListSchoolsUseCase(session=session, school_repo=SQLModelSchoolRepository(session))

@router.post("/", response_model=SchoolResponse, status_code=status.HTTP_201_CREATED)
async def create_school(
    request: CreateSchoolRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: CreateSchoolUseCase = Depends(get_create_school_use_case),
):
    input_dto = CreateSchoolInput(
        tenant_id=current_user.tenant_id,
        nome=request.nome,
    )
    school = await use_case.execute(input_dto)
    return school

@router.get("/", response_model=List[SchoolResponse])
async def list_schools(
    current_user: CurrentUser = Depends(get_current_user),
    use_case: ListSchoolsUseCase = Depends(get_list_schools_use_case),
):
    schools = await use_case.execute(current_user.tenant_id)
    return schools
