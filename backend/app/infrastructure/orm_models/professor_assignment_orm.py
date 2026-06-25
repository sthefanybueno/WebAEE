import uuid
from datetime import UTC, datetime

from sqlmodel import Field, SQLModel

from app.domain.entities.user import PapelUsuario


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)

class ProfessorAssignmentORM(SQLModel, table=True):
    __tablename__ = "professor_assignments"  # type: ignore[assignment]

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, nullable=False)
    usuario_id: uuid.UUID = Field(nullable=False, index=True)
    escola_id: uuid.UUID = Field(nullable=False, index=True)
    aluno_id: uuid.UUID = Field(nullable=False, index=True)
    tipo_papel: PapelUsuario = Field(nullable=False)
    data_inicio: datetime = Field(default_factory=_utcnow, nullable=False)
    data_fim: datetime | None = Field(default=None)
