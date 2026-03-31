"""
Sistema AEE — Domínio: Photo (Foto Pedagógica)
================================================
Registros fotográficos com tag pedagógica.
Suporte ao fluxo offline: criadas localmente e sincronizadas depois.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel

from app.domain.models import SyncStatus, TagPedagogica  # reutiliza enums existentes


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Photo(SQLModel, table=True):
    """Foto pedagógica vinculada a um aluno.

    Tabela: photos

    O arquivo físico é salvo no volume Docker (MVP) ou S3 (Fase 2).
    O campo `url` aponta para o path relativo ou URL assinada.
    `sync_status` indica se a foto já foi enviada ao servidor.
    """

    __tablename__ = "photos"  # type: ignore[assignment]

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )

    aluno_id: uuid.UUID = Field(
        nullable=False,
        index=True,
        description="FK lógica para students.id.",
    )

    autor_id: uuid.UUID = Field(
        nullable=False,
        description="FK lógica para users.id — quem fez o registro.",
    )

    url: str = Field(
        max_length=500,
        nullable=False,
        description="Path relativo ou URL assinada do arquivo.",
    )

    tag: TagPedagogica = Field(
        nullable=False,
        description="Categoria pedagógica da foto.",
    )

    sync_status: SyncStatus = Field(
        default=SyncStatus.LOCAL,
        nullable=False,
        description="LOCAL = criada offline ainda não enviada.",
    )

    descricao: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Legenda ou observação livre da foto.",
    )

    created_at: datetime = Field(default_factory=_utcnow, nullable=False)
