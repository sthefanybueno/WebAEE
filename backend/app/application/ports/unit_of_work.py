"""
Sistema AEE — Porta: Unit of Work
===================================
Abstração do padrão Unit of Work para a camada de Aplicação.

Responsabilidade:
  - Permitir que Use Cases gerenciem transações de banco de dados
    sem conhecer o SQLAlchemy ou qualquer outro ORM.
  - A implementação concreta (SQLAlchemyUnitOfWork) reside em
    infrastructure/unit_of_work_impl.py.

Uso nos Use Cases:
    async with self.uow.transaction():
        student = await self.student_repo.get_by_id(id)
        student.arquivar(user_id)
        await self.student_repo.save(student)
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager


class AbstractUnitOfWork(ABC):
    """Contrato para unidade de trabalho transacional.

    Implementado na infraestrutura; injetado nos Use Cases via DI.
    """

    @asynccontextmanager
    @abstractmethod
    async def transaction(self) -> AsyncIterator[None]:
        """Gerencia uma transação atômica.

        Uso:
            async with uow.transaction():
                # operações dentro da transação
        """
        raise NotImplementedError
        yield  # pragma: no cover — necessário para asynccontextmanager
