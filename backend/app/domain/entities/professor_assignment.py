"""
Sistema AEE — Domínio: ProfessorAssignment
============================================
Tabela pivot entre Professor × Escola × Aluno.
Controla o vínculo temporal de cada professor com um aluno específico.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel

from app.domain.entities.user import PapelUsuario


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ProfessorAssignment(SQLModel, table=True):
    """Vínculo temporal entre professor, escola e aluno.

    Tabela: professor_assignments

    Regras:
    - Um professor pode ser vinculado a múltiplos alunos.
    - `data_fim` nulo = vínculo ativo.
    - Na transferência de aluno: `data_fim = now()` para todos os vínculos ativos.
    - NUNCA delete registros — use `data_fim`.
    """

    __tablename__ = "professor_assignments"  # type: ignore[assignment]

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )

    usuario_id: uuid.UUID = Field(
        nullable=False,
        index=True,
        description="FK lógica para users.id.",
    )

    escola_id: uuid.UUID = Field(
        nullable=False,
        index=True,
        description="FK lógica para schools.id.",
    )

    aluno_id: uuid.UUID = Field(
        nullable=False,
        index=True,
        description="FK lógica para students.id.",
    )

    tipo_papel: PapelUsuario = Field(
        nullable=False,
        description="Papel do professor neste vínculo específico.",
    )

    data_inicio: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
        description="Início do vínculo.",
    )

    data_fim: Optional[datetime] = Field(
        default=None,
        description="Fim do vínculo. None = ativo. Definido na transferência ou encerramento.",
    )

    @property
    def ativo(self) -> bool:
        """Retorna True se o vínculo ainda está em vigor."""
        return self.data_fim is None
