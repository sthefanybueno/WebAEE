import uuid

import cloudinary.uploader
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.use_cases.photos.create_photo import (
    CreatePhotoInput,
    CreatePhotoUseCase,
)
from app.domain.models import TagPedagogica
from app.infrastructure.database import get_session
from app.infrastructure.repositories.photo_repository_impl import (
    SQLModelPhotoRepository,
)
from app.infrastructure.repositories.student_repository_impl import (
    SQLModelStudentRepository,
)
from app.infrastructure.unit_of_work_impl import SQLAlchemyUnitOfWork
from app.interfaces.dependencies import CurrentUser, get_current_user
from app.interfaces.schemas.photo import CreatePhotoRequest, PhotoResponse

router = APIRouter(prefix="/api/fotos", tags=["fotos"])

def get_create_photo_use_case(session: AsyncSession = Depends(get_session)) -> CreatePhotoUseCase:
    return CreatePhotoUseCase(
        uow=SQLAlchemyUnitOfWork(session),
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
        foto_url=request.url,
        tag=request.tag,
    )
    try:
        photo = await use_case.execute(input_dto)
        return photo
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    file: UploadFile = File(...),
    aluno_id: uuid.UUID = Form(...),
    tag: TagPedagogica = Form(...),
    current_user: CurrentUser = Depends(get_current_user),
    use_case: CreatePhotoUseCase = Depends(get_create_photo_use_case),
):
    try:
        upload_result = cloudinary.uploader.upload(
            file.file,
            folder="fotosAEE"
        )
        url = upload_result.get("secure_url")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary upload error: {str(e)}")
    
    input_dto = CreatePhotoInput(
        tenant_id=current_user.tenant_id,
        aluno_id=aluno_id,
        autor_id=current_user.id,
        foto_url=url,
        tag=tag,
    )
    
    try:
        photo = await use_case.execute(input_dto)
        return photo
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/aluno/{student_id}", response_model=list[PhotoResponse])
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

from app.application.use_cases.photos.sync_photo import SyncPhotoInput, SyncPhotoUseCase
from app.interfaces.schemas.photo import SyncPhotoRequest


def get_sync_photo_use_case(session: AsyncSession = Depends(get_session)) -> SyncPhotoUseCase:
    return SyncPhotoUseCase(
        uow=SQLAlchemyUnitOfWork(session),
        photo_repo=SQLModelPhotoRepository(session),
        student_repo=SQLModelStudentRepository(session),
    )

@router.post("/sync", response_model=list[PhotoResponse])
async def sync_photos(
    request: SyncPhotoRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: SyncPhotoUseCase = Depends(get_sync_photo_use_case),
):
    inputs = [
        SyncPhotoInput(
            id=i.id,
            aluno_id=i.aluno_id,
            autor_id=current_user.id,
            tenant_id=current_user.tenant_id,
            foto_url=i.url,
            tag=i.tag,
            sync_status=i.sync_status
        ) for i in request.items
    ]
    photos = await use_case.execute(inputs)
    return photos

@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    photo_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    repo = SQLModelPhotoRepository(session)
    photo = await repo.get_by_id(photo_id)
    if not photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada")
    
    # Extract public_id and delete from cloudinary
    if photo.url and "cloudinary.com" in photo.url:
        try:
            parts = photo.url.split("/upload/")
            if len(parts) == 2:
                path = parts[1]
                segments = path.split("/")
                if segments[0].startswith("v") and segments[0][1:].isdigit():
                    segments = segments[1:]
                public_id_with_ext = "/".join(segments)
                public_id = public_id_with_ext.rsplit(".", 1)[0]
                cloudinary.uploader.destroy(public_id)
        except Exception as e:
            print(f"Error deleting from Cloudinary: {e}")

    await repo.delete(photo_id)
    await session.commit()

