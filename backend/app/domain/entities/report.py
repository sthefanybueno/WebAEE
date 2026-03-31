"""
Sistema AEE — Domínio: Report e ReportTemplate
===============================================
Três tipos de relatório compartilham a mesma tabela `reports`,
discriminados pelo campo `tipo`.

Tipos:
  - aee        → criado pela Prof. AEE
  - anual      → Prof. AEE ou Profissional de Apoio
  - trimestral → Prof. AEE ou Professora Regente
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import Column
from sqlmodel import Field, SQLModel

import os
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB

_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
if "sqlite" in _DATABASE_URL:
    _JSON_TYPE = JSON
else:
    _JSON_TYPE = JSONB


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class TipoRelatorio(str, enum.Enum):
    """Discriminador de tipo de relatório."""

    AEE = "aee"
    ANUAL = "anual"
    TRIMESTRAL = "trimestral"


class SyncStatus(str, enum.Enum):
    """Estado de sincronização do relatório."""

    LOCAL = "local"
    SYNCED = "synced"
    FAILED = "failed"


class ReportTemplate(SQLModel, table=True):
    """Template configurável de relatório.

    Tabela: report_templates
    As `secoes` são um array JSONB — a estrutura de campos de cada seção
    fica no banco, permitindo alterar formulários sem redeploy.
    O campo `versao` cresce a cada alteração; relatórios congelam
    o snapshot da versão usada na criação.
    """

    __tablename__ = "report_templates"  # type: ignore[assignment]

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )

    tipo: TipoRelatorio = Field(
        nullable=False,
        index=True,
        description="Tipo de relatório que este template descreve.",
    )

    secoes: Optional[Any] = Field(
        default=None,
        sa_column=Column(_JSON_TYPE, nullable=True),
        description="Array JSONB de seções e campos configuráveis.",
    )

    versao: int = Field(
        default=1,
        nullable=False,
        description="Versão do template. Incrementa a cada alteração estrutural.",
    )

    ativo: bool = Field(default=True, nullable=False)

    created_at: datetime = Field(default_factory=_utcnow, nullable=False)
    updated_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": _utcnow},
    )


class Report(SQLModel, table=True):
    """Relatório pedagógico.

    Tabela: reports — discriminado por `tipo`.

    `template_snapshot`: congela a estrutura do template no momento da criação,
    isolando o relatório de futuras mudanças de template.

    `conflict_flag`: True quando o merge offline detecta colisão de versão.
    A UI exibe as duas versões para o usuário resolver manualmente.
    """

    __tablename__ = "reports"  # type: ignore[assignment]

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )

    tipo: TipoRelatorio = Field(
        nullable=False,
        index=True,
        description="Discriminador: aee | anual | trimestral.",
    )

    aluno_id: uuid.UUID = Field(
        nullable=False,
        index=True,
        description="FK lógica para students.id.",
    )

    autor_id: uuid.UUID = Field(
        nullable=False,
        description="FK lógica para users.id.",
    )

    template_snapshot: Optional[Any] = Field(
        default=None,
        sa_column=Column(_JSON_TYPE, nullable=True),
        description="Snapshot do template no momento da criação (imutável).",
    )

    conteudo_json: Optional[Any] = Field(
        default=None,
        sa_column=Column(_JSON_TYPE, nullable=True),
        description="Conteúdo preenchido pelo usuário (mutável até travar).",
    )

    travado: bool = Field(
        default=False,
        nullable=False,
        description="True = relatório finalizado; nenhuma edição permitida.",
    )

    sync_status: SyncStatus = Field(
        default=SyncStatus.SYNCED,
        nullable=False,
        description="Estado de sincronização offline.",
    )

    conflict_flag: bool = Field(
        default=False,
        nullable=False,
        description="True quando merge offline detectou conflito de versão.",
    )

    created_at: datetime = Field(default_factory=_utcnow, nullable=False)

    updated_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": _utcnow},
        description="Usado para detecção de conflito no sync offline.",
    )

    updated_by: Optional[uuid.UUID] = Field(
        default=None,
        description="FK lógica para users.id — último editor.",
    )
