import os
import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
if "sqlite" in _DATABASE_URL:
    _JSON_TYPE = JSON
else:
    _JSON_TYPE = JSONB


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class NotificationORM(SQLModel, table=True):
    __tablename__ = "notifications"  # type: ignore[assignment]

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    tenant_id: uuid.UUID = Field(nullable=False, index=True)
    autor_id: uuid.UUID = Field(nullable=False, description="FK para users.id — quem gerou o evento.")
    tipo: str = Field(nullable=False, description="Tipo do evento: relatorio_criado | aluno_cadastrado.")
    mensagem: str = Field(nullable=False, max_length=500)
    relatorio_id: uuid.UUID | None = Field(default=None, index=True)
    aluno_id: uuid.UUID | None = Field(default=None, index=True)
    lida: bool = Field(default=False, nullable=False, index=True)
    created_at: datetime = Field(default_factory=_utcnow, nullable=False)
