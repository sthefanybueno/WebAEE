"""
Sistema AEE — Domínio: AuditLog
==================================
Registro imutável de acesso a campos sensíveis (LGPD art. 37).
Toda leitura de `diagnostico` ou `laudo` gera uma linha aqui.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from pydantic import BaseModel, Field


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


# Campos considerados sensíveis para fins de auditoria LGPD
SENSITIVE_FIELDS = frozenset({"diagnostico", "laudo"})


class AuditLog(BaseModel):
    """Log imutável de acesso a dados sensíveis.

    Conforme LGPD art. 37: o controlador e o operador devem
    manter registro das operações de tratamento de dados pessoais.

    Regras:
    - Apenas INSERT (nenhum UPDATE ou DELETE permitido).
    - Criado automaticamente pela camada de aplicação ao servir
      `GET /api/alunos/{id}/dados-sensiveis`.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID = Field(description="FK lógica para users.id — quem acessou.")
    student_id: uuid.UUID = Field(description="FK lógica para students.id — de quem foram acessados os dados.")
    field_accessed: str = Field(max_length=100, description="Nome do campo sensível acessado (ex: 'diagnostico').")
    accessed_at: datetime = Field(default_factory=_utcnow, description="Timestamp UTC do acesso.")
    ip_address: str | None = Field(default=None, max_length=45, description="Endereço IP do cliente (IPv4 ou IPv6, opcional).")
