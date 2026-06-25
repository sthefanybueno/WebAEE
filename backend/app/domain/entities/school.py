"""
Sistema AEE — Domínio: School (Escola)
========================================
Unidade escolar vinculada a um tenant.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from pydantic import BaseModel, Field


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class School(BaseModel):
    """Escola pública vinculada à SEMED (tenant).

    Tabela: schools
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    tenant_id: uuid.UUID = Field(description="FK lógica para tenants.id.")
    nome: str = Field(min_length=2, max_length=255, description="Nome da escola.")
    ativo: bool = Field(default=True, description="Escola desativada não aparece para vinculação de novos alunos.")
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
