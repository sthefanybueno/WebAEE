"""
conftest.py — Fixtures compartilhados para testes de camada de aplicação.

Define MockUnitOfWork centralizado para que todos os arquivos de teste
usem a mesma implementação sem duplicação.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

import pytest

from app.application.ports.unit_of_work import AbstractUnitOfWork


class MockUnitOfWork(AbstractUnitOfWork):
    """Unit of Work sem operações reais — usado para testes unitários de Use Cases."""

    @asynccontextmanager
    async def transaction(self) -> AsyncIterator[None]:
        yield
