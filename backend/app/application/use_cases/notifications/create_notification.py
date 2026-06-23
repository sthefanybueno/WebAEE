"""
Use Case: Criar Notificação
============================
Gera uma notificação de evento no sistema.
Disparado pelo router de relatórios ao criar um novo registro.

[DDD] A lógica de construção da entidade reside aqui.
O router apenas passa os dados; este Use Case encapsula a criação.
"""

import uuid
from dataclasses import dataclass
from typing import Optional

from app.application.ports.notification_repository import NotificationRepository
from app.domain.entities.notification import Notification


@dataclass
class CreateNotificationInput:
    tenant_id: uuid.UUID
    autor_id: uuid.UUID
    tipo: str
    mensagem: str
    relatorio_id: Optional[uuid.UUID] = None
    aluno_id: Optional[uuid.UUID] = None


class CreateNotificationUseCase:
    """Caso de uso para criação de notificações de eventos no sistema."""

    def __init__(self, notification_repo: NotificationRepository) -> None:
        self.notification_repo = notification_repo

    async def execute(self, input_dto: CreateNotificationInput) -> Notification:
        """Persiste uma nova notificação."""
        notification = Notification(
            tenant_id=input_dto.tenant_id,
            autor_id=input_dto.autor_id,
            tipo=input_dto.tipo,
            mensagem=input_dto.mensagem,
            relatorio_id=input_dto.relatorio_id,
            aluno_id=input_dto.aluno_id,
        )
        return await self.notification_repo.save(notification)
