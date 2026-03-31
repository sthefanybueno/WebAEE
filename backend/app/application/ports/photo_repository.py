import uuid
from typing import List, Optional, Protocol

from app.domain.entities.photo import Photo


class PhotoRepository(Protocol):
    async def get_by_id(self, id: uuid.UUID) -> Optional[Photo]:
        ...

    async def list_by_student(self, student_id: uuid.UUID) -> List[Photo]:
        ...

    async def save(self, photo: Photo) -> Photo:
        ...
