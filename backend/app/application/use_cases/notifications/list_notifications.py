"""
Use Case: Listar Notificações
==============================
Lista notificações para o usuário logado.

Regras RBAC:
- ADMIN, COORDENACAO, PROF_AEE: recebem notificações do tenant.
- PROF_APOIO, PROF_REGENTE: não têm acesso (retorna lista vazia).
"""

import uuid
from dataclasses import dataclass

from app.application.ports.notification_repository import NotificationRepository
from app.domain.entities.notification import Notification
from app.domain.entities.user import PapelUsuario

_PAPEIS_COM_NOTIFICACAO = {
    PapelUsuario.ADMIN,
    PapelUsuario.COORDENACAO,
    PapelUsuario.PROF_AEE,
}


@dataclass
class ListNotificationsInput:
    tenant_id: uuid.UUID
    papel: PapelUsuario
    apenas_nao_lidas: bool = False


class ListNotificationsUseCase:
    """Caso de uso para listar notificações do tenant filtradas por papel."""

    def __init__(self, notification_repo: NotificationRepository) -> None:
        self.notification_repo = notification_repo

    async def execute(self, input_dto: ListNotificationsInput) -> list[Notification]:
        """Retorna notificações; lista vazia para papéis sem acesso."""
        if input_dto.papel not in _PAPEIS_COM_NOTIFICACAO:
            return []

        return await self.notification_repo.list_by_tenant(
            tenant_id=input_dto.tenant_id,
            apenas_nao_lidas=input_dto.apenas_nao_lidas,
        )
