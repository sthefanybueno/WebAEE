"""
Sistema AEE — Domínio: User (Usuário)
======================================
Qualquer pessoa que faz login no sistema.
O campo `papel` determina as permissões via RBAC.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class PapelUsuario(str, enum.Enum):
    """Papéis de acesso do sistema AEE.

    Determina o que cada usuário pode ver e editar.
    Aplicado via middleware FastAPI + RLS PostgreSQL.
    """

    COORDENACAO = "coordenacao"
    PROF_AEE = "prof_aee"
    PROF_APOIO = "prof_apoio"
    PROF_REGENTE = "prof_regente"


class User(SQLModel, table=True):
    """Usuário autenticado do sistema.

    Tabela: users
    Papel determina permissões; tenant_id isola os dados.
    """

    __tablename__ = "users"  # type: ignore[assignment]

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

    email: str = Field(
        max_length=255,
        nullable=False,
        unique=True,
        index=True,
        description="Email único no sistema (login).",
    )

    hashed_password: str = Field(
        nullable=False,
        description="Senha hasheada com bcrypt. Nunca retornar na API.",
    )

    nome: str = Field(
        min_length=2,
        max_length=255,
        nullable=False,
        description="Nome completo do usuário.",
    )

    papel: PapelUsuario = Field(
        nullable=False,
        description="Papel RBAC: coordenacao | prof_aee | prof_apoio | prof_regente.",
    )

    ativo: bool = Field(
        default=True,
        nullable=False,
        description="Soft-disable: False bloqueia login sem remover o usuário.",
    )

    created_at: datetime = Field(default_factory=_utcnow, nullable=False)

    updated_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": _utcnow},
    )
