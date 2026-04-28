import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class StudentSchoolHistory(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    student_id: uuid.UUID = Field()
    school_id: uuid.UUID = Field()
    user_id: uuid.UUID = Field(description="Quem transferiu")
    transfer_date: datetime = Field(default_factory=_utcnow)
