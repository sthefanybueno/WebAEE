import uuid
from datetime import UTC, datetime

from sqlmodel import Field, SQLModel

from app.domain.models import SyncStatus, TagPedagogica


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)

class PhotoORM(SQLModel, table=True):
    __tablename__ = "photos"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, nullable=False)
    aluno_id: uuid.UUID = Field(nullable=False, index=True)
    autor_id: uuid.UUID = Field(nullable=False)
    url: str = Field(max_length=500, nullable=False)
    tag: TagPedagogica = Field(nullable=False)
    sync_status: SyncStatus = Field(default=SyncStatus.LOCAL, nullable=False)
    descricao: str | None = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=_utcnow, nullable=False)
