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

from pydantic import BaseModel, Field

from app.domain.entities.user import PapelUsuario


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ProfessorAssignment(BaseModel):
    """Vínculo temporal entre professor, escola e aluno.

    Regras:
    - Um professor pode ser vinculado a múltiplos alunos.
    - `data_fim` nulo = vínculo ativo.
    - Na transferência de aluno: `data_fim = now()` para todos os vínculos ativos.
    - NUNCA delete registros — use `data_fim`.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    usuario_id: uuid.UUID = Field(description="FK lógica para users.id.")
    escola_id: uuid.UUID = Field(description="FK lógica para schools.id.")
    aluno_id: uuid.UUID = Field(description="FK lógica para students.id.")
    tipo_papel: PapelUsuario = Field(description="Papel do professor neste vínculo específico.")
    data_inicio: datetime = Field(default_factory=_utcnow, description="Início do vínculo.")
    data_fim: Optional[datetime] = Field(default=None, description="Fim do vínculo. None = ativo. Definido na transferência ou encerramento.")

    @property
    def ativo(self) -> bool:
        """Retorna True se o vínculo ainda está em vigor."""
        return self.data_fim is None

    def revogar(self, agora: datetime) -> None:
        """Encerra o vínculo do professor com o aluno.

        Encapsula a regra de negócio: vínculos não são deletados,
        apenas encerrados com data_fim. Usado na transferência de aluno.

        Args:
            agora: Timestamp UTC do encerramento (passado pelo use case
                   para garantir consistência transacional).
        """
        if self.data_fim is not None:
            return  # Vínculo já revogado — operação idempotente
        self.data_fim = agora
