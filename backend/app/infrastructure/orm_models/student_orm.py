import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel
from app.domain.models import StatusAluno

def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

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
    data_nascimento: Optional[datetime] = Field(default=None)
    escola_atual_id: Optional[uuid.UUID] = Field(default=None)
    apoio_id: Optional[uuid.UUID] = Field(default=None, description="FK para users.id — professor de apoio designado.")
    diagnostico: Optional[str] = Field(default=None)
    laudo: Optional[str] = Field(default=None)
    consentimento_lgpd: bool = Field(default=False, nullable=False)
    data_consentimento: Optional[datetime] = Field(default=None)
    base_legal: Optional[str] = Field(default=None, max_length=255)
    status: StatusAluno = Field(default=StatusAluno.ATIVO, nullable=False, index=True)
    created_at: datetime = Field(default_factory=_utcnow, nullable=False)
    updated_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": _utcnow},
    )
    updated_by: Optional[uuid.UUID] = Field(default=None)
    conflict_flag: bool = Field(default=False, nullable=False)
