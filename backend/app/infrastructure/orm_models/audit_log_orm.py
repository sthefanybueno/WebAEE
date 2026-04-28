import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel

def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

class AuditLogORM(SQLModel, table=True):
    __tablename__ = "audit_log"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, nullable=False)
    user_id: uuid.UUID = Field(nullable=False, index=True)
    student_id: uuid.UUID = Field(nullable=False, index=True)
    field_accessed: str = Field(max_length=100, nullable=False)
    accessed_at: datetime = Field(default_factory=_utcnow, nullable=False)
    ip_address: Optional[str] = Field(default=None, max_length=45)
