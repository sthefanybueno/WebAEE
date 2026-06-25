from collections.abc import AsyncGenerator

import pytest

from app.infrastructure.database import engine, init_db


@pytest.fixture(autouse=True)
async def setup_db() -> AsyncGenerator[None, None]:
    await init_db()
    yield
    await engine.dispose()
