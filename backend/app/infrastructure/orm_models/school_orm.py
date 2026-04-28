import uuid
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel

def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

class SchoolORM(SQLModel, table=True):
    __tablename__ = "schools"  # type: ignore[assignment]

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    tenant_id: uuid.UUID = Field(nullable=False, index=True)
    nome: str = Field(min_length=2, max_length=255, nullable=False)
    ativo: bool = Field(default=True, nullable=False)
    created_at: datetime = Field(default_factory=_utcnow, nullable=False)
    updated_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": _utcnow},
    )
