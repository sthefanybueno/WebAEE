import asyncio

from sqlmodel.ext.asyncio.session import AsyncSession

from app.infrastructure.database import engine
from app.infrastructure.repositories.user_repository_impl import SQLModelUserRepository


async def main():
    async with AsyncSession(engine) as s:
        r = SQLModelUserRepository(s)
        u = await r.get_by_email('admin@escola.com')
        print('Role in DB is:', u.papel if u else 'Nao encontrado')

asyncio.run(main())
