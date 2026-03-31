import uuid
from typing import Optional, Protocol

from app.domain.entities.user import User


class UserRepository(Protocol):
    async def get_by_id(self, id: uuid.UUID) -> Optional[User]:
        ...

    async def get_by_email(self, email: str) -> Optional[User]:
        ...

    async def save(self, user: User) -> User:
        ...
