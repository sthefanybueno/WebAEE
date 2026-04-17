import uuid
from typing import List, Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.photo_repository import PhotoRepository
from app.domain.entities.photo import Photo


class SQLModelPhotoRepository(PhotoRepository):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, id: uuid.UUID) -> Optional[Photo]:
        return await self.session.get(Photo, id)

    async def list_by_student(self, student_id: uuid.UUID) -> List[Photo]:
        statement = select(Photo).where(Photo.aluno_id == student_id)
        result = await self.session.exec(statement)
        return list(result.all())

    async def save(self, photo: Photo) -> Photo:
        self.session.add(photo)
        await self.session.flush()
        return photo
