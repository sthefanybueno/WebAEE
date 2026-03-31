import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.use_cases.photos.create_photo import (
    CreatePhotoInput,
    CreatePhotoUseCase,
)
from app.infrastructure.database import get_session
from app.infrastructure.repositories.photo_repository_impl import (
    SQLModelPhotoRepository,
)
from app.infrastructure.repositories.student_repository_impl import (
    SQLModelStudentRepository,
)
from app.interfaces.dependencies import CurrentUser, get_current_user
from app.interfaces.schemas.photo import CreatePhotoRequest, PhotoResponse

router = APIRouter(prefix="/api/fotos", tags=["fotos"])

def get_create_photo_use_case(session: AsyncSession = Depends(get_session)) -> CreatePhotoUseCase:
    return CreatePhotoUseCase(
        photo_repo=SQLModelPhotoRepository(session),
        student_repo=SQLModelStudentRepository(session),
    )

@router.post("/", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED)
async def create_photo(
    request: CreatePhotoRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: CreatePhotoUseCase = Depends(get_create_photo_use_case),
):
    input_dto = CreatePhotoInput(
        tenant_id=current_user.tenant_id,
        aluno_id=request.aluno_id,
        autor_id=current_user.id,
        foto_url=request.foto_url,
        tag=request.tag,
    )
    try:
        photo = await use_case.execute(input_dto)
        return photo
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/aluno/{student_id}", response_model=List[PhotoResponse])
async def list_photos_by_student(
    student_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    # Validar se aluno é do tenant
    student_repo = SQLModelStudentRepository(session)
    student = await student_repo.get_by_id(student_id)
    if not student or student.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Estudante não encontrado")

    repo = SQLModelPhotoRepository(session)
    photos = await repo.list_by_student(student_id)
    return photos
