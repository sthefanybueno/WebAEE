import uuid
from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)

class AuditLogORM(SQLModel, table=True):
    __tablename__ = "audit_log"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, nullable=False)
    user_id: uuid.UUID = Field(nullable=False, index=True)
    student_id: uuid.UUID = Field(nullable=False, index=True)
    field_accessed: str = Field(max_length=100, nullable=False)
    accessed_at: datetime = Field(default_factory=_utcnow, nullable=False)
    ip_address: str | None = Field(default=None, max_length=45)
