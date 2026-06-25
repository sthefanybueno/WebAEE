"""
Sistema AEE — Infraestrutura: SQLAlchemy Unit of Work
======================================================
Implementação concreta do AbstractUnitOfWork usando AsyncSession
do SQLModel/SQLAlchemy.

Esta implementação é injetada nos Use Cases pelo Router (camada de
Interfaces), mantendo os Use Cases completamente agnósticos de banco.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.ports.unit_of_work import AbstractUnitOfWork


class SQLAlchemyUnitOfWork(AbstractUnitOfWork):
    """Unit of Work baseado em AsyncSession do SQLAlchemy/SQLModel."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    @asynccontextmanager
    async def transaction(self) -> AsyncIterator[None]:
        """Abre uma transação atômica e faz commit ou rollback automaticamente."""
        async with self._session.begin():
            yield
