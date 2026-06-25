import uuid
from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class ScheduleORM(SQLModel, table=True):
    __tablename__ = "schedules"  # type: ignore[assignment]

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    tenant_id: uuid.UUID = Field(nullable=False, index=True)
    aee_id: uuid.UUID = Field(nullable=False, index=True, description="FK para users.id — AEE dona desta agenda.")
    aluno_id: uuid.UUID = Field(nullable=False, index=True)
    dia_semana: str = Field(nullable=False)
    hora: str = Field(nullable=False)
    atividade: str = Field(nullable=False)
    tipo_slot: str = Field(default="normal", nullable=False)
    created_at: datetime = Field(default_factory=_utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=_utcnow, nullable=False)
    created_by: uuid.UUID | None = Field(default=None)
