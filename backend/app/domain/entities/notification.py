"""
Sistema AEE — Domínio: Notification (Notificação)
===================================================
Notificações são geradas automaticamente quando relatórios são cadastrados.
Destinadas a admins, coordenadores e AEEs.

[DDD] Entidade RICA: encapsula o comportamento de marcar como lida.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Notification(BaseModel):
    """Notificação de evento no sistema.

    Tabela: notifications
    Criada automaticamente ao cadastrar relatórios.
    Visível para: ADMIN, COORDENACAO, PROF_AEE.

    Ciclo de vida:
        lida: False → True (marcar_como_lida)
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    tenant_id: uuid.UUID = Field(description="FK lógica para tenants.id.")
    autor_id: uuid.UUID = Field(description="FK lógica para users.id — quem gerou o evento.")
    tipo: str = Field(description="Tipo do evento: 'relatorio_criado' | 'aluno_cadastrado'.")
    mensagem: str = Field(max_length=500, description="Texto legível da notificação.")
    relatorio_id: Optional[uuid.UUID] = Field(default=None, description="FK opcional para reports.id.")
    aluno_id: Optional[uuid.UUID] = Field(default=None, description="FK opcional para students.id.")
    lida: bool = Field(default=False, description="False = não lida; True = usuário já visualizou.")
    created_at: datetime = Field(default_factory=_utcnow)

    # ── Comportamentos de domínio (Entidade Rica) ─────────

    def marcar_como_lida(self) -> None:
        """Marca a notificação como lida.

        Regra de negócio: operação idempotente — chamar em notificação já lida não gera erro.
        """
        self.lida = True
