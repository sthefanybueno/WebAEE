import uuid
from typing import Protocol

from app.domain.entities.photo import Photo


class PhotoRepository(Protocol):
    async def get_by_id(self, id: uuid.UUID) -> Photo | None:
        ...

    async def list_by_student(self, student_id: uuid.UUID) -> list[Photo]:
        ...

    async def save(self, photo: Photo) -> Photo:
        ...

    async def delete(self, id: uuid.UUID) -> None:
        ...
