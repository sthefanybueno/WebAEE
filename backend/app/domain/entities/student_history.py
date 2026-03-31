import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class StudentSchoolHistory(SQLModel, table=True):
    __tablename__ = "student_school_history"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student_id: uuid.UUID = Field(nullable=False, index=True)
    school_id: uuid.UUID = Field(nullable=False, index=True)
    user_id: uuid.UUID = Field(nullable=False, description="Quem transferiu")
    transfer_date: datetime = Field(default_factory=_utcnow, nullable=False)
