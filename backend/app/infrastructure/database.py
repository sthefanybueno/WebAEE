import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from sqlalchemy.pool import StaticPool

# URL do banco. Fallback para sqlite in memory para testes rápidos se não for fornecido.
DATABASE_URL = os.environ.get(
    "DATABASE_URL", "sqlite+aiosqlite:///:memory:"
)

# SQLite em memória precisa de check_same_thread=False e StaticPool
kwargs = {}
if "sqlite" in DATABASE_URL:
    kwargs["connect_args"] = {"check_same_thread": False}
    if ":memory:" in DATABASE_URL:
        kwargs["poolclass"] = StaticPool

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    **kwargs
)

async def init_db() -> None:
    """Cria tabelas se não existirem (apenas fallback, ideal é Alembic)."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency Provider para FastAPI injetar nos repositórios."""
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session
