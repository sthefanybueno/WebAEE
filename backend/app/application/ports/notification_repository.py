"""
Sistema AEE — Port: NotificationRepository
============================================
Contrato de acesso a notificações.
A implementação concreta fica na camada de infraestrutura.
"""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod

from app.domain.entities.notification import Notification


class NotificationRepository(ABC):
    """Interface de repositório para notificações."""

    @abstractmethod
    async def get_by_id(self, id: uuid.UUID) -> Notification | None:
        """Busca notificação por ID."""
        ...

    @abstractmethod
    async def list_by_tenant(self, tenant_id: uuid.UUID, apenas_nao_lidas: bool = False) -> list[Notification]:
        """Lista notificações de um tenant, opcionalmente apenas as não lidas."""
        ...

    @abstractmethod
    async def save(self, notification: Notification) -> Notification:
        """Persiste ou atualiza uma notificação."""
        ...
