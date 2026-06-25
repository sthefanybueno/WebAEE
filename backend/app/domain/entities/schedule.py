"""
Sistema AEE — Domínio: Schedule (Agenda / Horário)
====================================================
Cada AEE possui sua própria agenda de atendimentos.
O campo `aee_id` garante que cada slot pertence a uma AEE específica.

[DDD] Entidade RICA: encapsula validação de propriedade via método `pode_ser_editado`.
"""

import uuid
from datetime import UTC, datetime

from pydantic import BaseModel, Field


def _utcnow() -> datetime:
    """Retorna o instante atual em UTC (naive, sem tzinfo)."""
    return datetime.now(UTC).replace(tzinfo=None)


class Schedule(BaseModel):
    """Agenda/Horário de atendimento pedagógico.

    Tabela: schedules
    Cada horário pertence a uma AEE (aee_id) e está vinculado a um aluno (aluno_id).
    Isolamento multi-tenant garantido pelo campo `tenant_id`.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    tenant_id: uuid.UUID = Field(description="FK lógica para tenants.id.")
    aee_id: uuid.UUID = Field(description="FK lógica para users.id — a AEE dona desta agenda.")
    aluno_id: uuid.UUID = Field(description="FK lógica para students.id.")
    dia_semana: str = Field(description="Ex: seg, ter, qua, qui, sex")
    hora: str = Field(description="Ex: 07h30, 09h00")
    atividade: str = Field(description="Descrição da atividade de atendimento.")
    tipo_slot: str = Field(default="normal", description="Ex: normal, conflito, especial")

    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    created_by: uuid.UUID | None = Field(default=None, description="FK lógica para users.id — quem criou o registro.")

    # ── Comportamentos de domínio (Entidade Rica) ─────────

    def pode_ser_editado(self, user_id: uuid.UUID) -> bool:
        """Verifica se este usuário pode editar este slot de agenda.

        Regra de negócio: apenas a AEE dona da agenda pode editá-la.
        Admin pode editar qualquer agenda.

        Args:
            user_id: ID do usuário tentando editar.

        Returns:
            True se o usuário tem permissão.
        """
        return self.aee_id == user_id
