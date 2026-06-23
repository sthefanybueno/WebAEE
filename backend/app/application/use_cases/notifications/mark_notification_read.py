"""
Use Case: Marcar Notificação Como Lida
========================================
Usa o método rico da entidade para marcar a notificação.
"""

import uuid
from dataclasses import dataclass

from app.application.ports.notification_repository import NotificationRepository
from app.domain.entities.notification import Notification
from app.domain.exceptions import NotificacaoNaoEncontradaError, TenantMismatchError


@dataclass
class MarkNotificationReadInput:
    notification_id: uuid.UUID
    tenant_id: uuid.UUID


class MarkNotificationReadUseCase:
    """Caso de uso para marcar uma notificação como lida."""

    def __init__(self, notification_repo: NotificationRepository) -> None:
        self.notification_repo = notification_repo

    async def execute(self, input_dto: MarkNotificationReadInput) -> Notification:
        notification = await self.notification_repo.get_by_id(input_dto.notification_id)
        if not notification:
            raise NotificacaoNaoEncontradaError(input_dto.notification_id)

        if notification.tenant_id != input_dto.tenant_id:
            raise TenantMismatchError("notificação")

        notification.marcar_como_lida()
        return await self.notification_repo.save(notification)
