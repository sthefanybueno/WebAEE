import uuid
from datetime import UTC, datetime

from sqlmodel import Field, SQLModel

from app.domain.models import StatusAluno


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)

class StudentORM(SQLModel, table=True):
    __tablename__ = "students"  # type: ignore[assignment]

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    tenant_id: uuid.UUID = Field(nullable=False)
    nome: str = Field(min_length=2, max_length=255, nullable=False)
    data_nascimento: datetime | None = Field(default=None)
    escola_atual_id: uuid.UUID | None = Field(default=None)
    apoio_id: uuid.UUID | None = Field(default=None, description="FK para users.id — professor de apoio designado.")
    diagnostico: str | None = Field(default=None)
    laudo: str | None = Field(default=None)
    consentimento_lgpd: bool = Field(default=False, nullable=False)
    data_consentimento: datetime | None = Field(default=None)
    base_legal: str | None = Field(default=None, max_length=255)
    status: StatusAluno = Field(default=StatusAluno.ATIVO, nullable=False, index=True)
    created_at: datetime = Field(default_factory=_utcnow, nullable=False)
    updated_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": _utcnow},
    )
    updated_by: uuid.UUID | None = Field(default=None)
    conflict_flag: bool = Field(default=False, nullable=False)
