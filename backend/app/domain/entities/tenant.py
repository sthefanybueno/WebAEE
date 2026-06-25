"""
Sistema AEE — Domínio: Tenant
==============================
Unidade administrativa raiz do isolamento multi-tenant.
Todos os dados do sistema são subordinados a um tenant.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from pydantic import BaseModel, Field


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class Tenant(BaseModel):
    """Unidade administrativa (ex: SEMED).

    Tabela: tenants
    Todo dado do sistema é isolado por tenant via RLS e FK.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4, description="PK gerada pela aplicação.")
    nome: str = Field(min_length=2, max_length=255, description="Nome da unidade administrativa (ex: 'SEMED Manaus').")
    ativo: bool = Field(default=True, description="Tenant desativado bloqueia todos os usuários vinculados.")
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)

    # ── Evita conflito de metadados ao usar table=True em múltiplos modelos ──
    class Config:
        arbitrary_types_allowed = True
