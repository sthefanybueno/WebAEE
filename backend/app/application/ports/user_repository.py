import uuid
from typing import Optional, List, Protocol

from app.domain.entities.user import User


class UserRepository(Protocol):
    async def get_by_id(self, id: uuid.UUID) -> Optional[User]:
        ...

    async def get_by_email(self, email: str) -> Optional[User]:
        ...

    async def save(self, user: User) -> User:
        ...

    async def list_by_tenant(self, tenant_id: uuid.UUID) -> List[User]:
        ...
