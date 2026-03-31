"""
Sistema AEE — Domínio: School (Escola)
========================================
Unidade escolar vinculada a um tenant.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class School(SQLModel, table=True):
    """Escola pública vinculada à SEMED (tenant).

    Tabela: schools
    """

    __tablename__ = "schools"  # type: ignore[assignment]

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )

    tenant_id: uuid.UUID = Field(
        nullable=False,
        index=True,
        description="FK lógica para tenants.id.",
    )

    nome: str = Field(
        min_length=2,
        max_length=255,
        nullable=False,
        description="Nome da escola.",
    )

    ativo: bool = Field(
        default=True,
        nullable=False,
        description="Escola desativada não aparece para vinculação de novos alunos.",
    )

    created_at: datetime = Field(default_factory=_utcnow, nullable=False)

    updated_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": _utcnow},
    )
