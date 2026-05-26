import uuid
from datetime import datetime, timezone
from typing import Any, Optional, Dict, List, Union
import os
from sqlalchemy import Column, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel
from app.domain.entities.report import TipoRelatorio, SyncStatus

_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
if "sqlite" in _DATABASE_URL:
    _JSON_TYPE = JSON
else:
    _JSON_TYPE = JSONB

def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

class ReportTemplateORM(SQLModel, table=True):
    __tablename__ = "report_templates"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, nullable=False)
    tipo: TipoRelatorio = Field(nullable=False, index=True)
    secoes: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = Field(
        default=None,
        sa_column=Column(_JSON_TYPE, nullable=True),
    )
    versao: int = Field(default=1, nullable=False)
    ativo: bool = Field(default=True, nullable=False)
    created_at: datetime = Field(default_factory=_utcnow, nullable=False)
    updated_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": _utcnow},
    )

class ReportORM(SQLModel, table=True):
    __tablename__ = "reports"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, nullable=False)
    tipo: TipoRelatorio = Field(nullable=False, index=True)
    aluno_id: uuid.UUID = Field(nullable=False, index=True)
    autor_id: uuid.UUID = Field(nullable=False)
    template_snapshot: Optional[Dict[str, Any]] = Field(
        default=None, sa_column=Column(_JSON_TYPE, nullable=True)
    )
    conteudo_json: Optional[Dict[str, Any]] = Field(
        default=None, sa_column=Column(_JSON_TYPE, nullable=True)
    )
    travado: bool = Field(default=False, nullable=False)
    sync_status: SyncStatus = Field(default=SyncStatus.SYNCED, nullable=False)
    conflict_flag: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(default_factory=_utcnow, nullable=False)
    updated_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": _utcnow},
    )
    updated_by: Optional[uuid.UUID] = Field(default=None)
