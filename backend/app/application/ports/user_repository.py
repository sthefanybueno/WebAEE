import uuid
from typing import Protocol

from app.domain.entities.user import User


class UserRepository(Protocol):
    async def get_by_id(self, id: uuid.UUID) -> User | None:
        ...

    async def get_by_email(self, email: str) -> User | None:
        ...

    async def save(self, user: User) -> User:
        ...

    async def list_by_tenant(
        self, 
        tenant_id: uuid.UUID,
        nome: str | None = None,
        papel: str | None = None,
        page: int = 1,
        size: int = 50
    ) -> tuple[list[User], int]:
        ...
