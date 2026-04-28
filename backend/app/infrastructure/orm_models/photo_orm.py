import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel
from app.domain.models import TagPedagogica, SyncStatus

def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

class PhotoORM(SQLModel, table=True):
    __tablename__ = "photos"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, nullable=False)
    aluno_id: uuid.UUID = Field(nullable=False, index=True)
    autor_id: uuid.UUID = Field(nullable=False)
    url: str = Field(max_length=500, nullable=False)
    tag: TagPedagogica = Field(nullable=False)
    sync_status: SyncStatus = Field(default=SyncStatus.LOCAL, nullable=False)
    descricao: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=_utcnow, nullable=False)
