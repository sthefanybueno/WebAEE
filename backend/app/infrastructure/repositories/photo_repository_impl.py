import uuid
from typing import List, Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.photo_repository import PhotoRepository
from app.domain.entities.photo import Photo
from app.infrastructure.orm_models.photo_orm import PhotoORM


class SQLModelPhotoRepository(PhotoRepository):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, id: uuid.UUID) -> Optional[Photo]:
        orm = await self.session.get(PhotoORM, id)
        if orm:
            return Photo(**orm.model_dump())
        return None

    async def list_by_student(self, student_id: uuid.UUID) -> List[Photo]:
        statement = select(PhotoORM).where(PhotoORM.aluno_id == student_id)
        result = await self.session.exec(statement)
        return [Photo(**orm.model_dump()) for orm in result.all()]

    async def save(self, photo: Photo) -> Photo:
        orm = PhotoORM(**photo.model_dump())
        orm = await self.session.merge(orm)
        await self.session.flush()
        return Photo(**orm.model_dump())
