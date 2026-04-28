import uuid
from typing import Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.user_repository import UserRepository
from app.domain.entities.user import User
from app.infrastructure.orm_models.user_orm import UserORM


class SQLModelUserRepository(UserRepository):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, id: uuid.UUID) -> Optional[User]:
        orm = await self.session.get(UserORM, id)
        if orm:
            return User(**orm.model_dump())
        return None

    async def get_by_email(self, email: str) -> Optional[User]:
        statement = select(UserORM).where(UserORM.email == email)
        result = await self.session.exec(statement)
        orm = result.first()
        if orm:
            return User(**orm.model_dump())
        return None

    async def save(self, user: User) -> User:
        orm = UserORM(**user.model_dump())
        orm = await self.session.merge(orm)
        await self.session.flush()
        return User(**orm.model_dump())

    async def list_by_tenant(self, tenant_id: uuid.UUID) -> list[User]:
        statement = select(UserORM).where(UserORM.tenant_id == tenant_id)
        result = await self.session.exec(statement)
        return [User(**orm.model_dump()) for orm in result.all()]
