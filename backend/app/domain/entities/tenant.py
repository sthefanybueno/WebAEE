"""
Sistema AEE — Domínio: Tenant
==============================
Unidade administrativa raiz do isolamento multi-tenant.
Todos os dados do sistema são subordinados a um tenant.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Tenant(SQLModel, table=True):
    """Unidade administrativa (ex: SEMED).

    Tabela: tenants
    Todo dado do sistema é isolado por tenant via RLS e FK.
    """

    __tablename__ = "tenants"  # type: ignore[assignment]

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
        description="PK gerada pela aplicação.",
    )

    nome: str = Field(
        min_length=2,
        max_length=255,
        nullable=False,
        description="Nome da unidade administrativa (ex: 'SEMED Manaus').",
    )

    ativo: bool = Field(
        default=True,
        nullable=False,
        description="Tenant desativado bloqueia todos os usuários vinculados.",
    )

    created_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
    )

    updated_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": _utcnow},
    )

    # ── Evita conflito de metadados ao usar table=True em múltiplos modelos ──
    class Config:
        arbitrary_types_allowed = True
