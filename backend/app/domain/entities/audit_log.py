"""
Sistema AEE — Domínio: AuditLog
==================================
Registro imutável de acesso a campos sensíveis (LGPD art. 37).
Toda leitura de `diagnostico` ou `laudo` gera uma linha aqui.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# Campos considerados sensíveis para fins de auditoria LGPD
SENSITIVE_FIELDS = frozenset({"diagnostico", "laudo"})


class AuditLog(SQLModel, table=True):
    """Log imutável de acesso a dados sensíveis.

    Tabela: audit_log

    Conforme LGPD art. 37: o controlador e o operador devem
    manter registro das operações de tratamento de dados pessoais.

    Regras:
    - Apenas INSERT (nenhum UPDATE ou DELETE permitido).
    - Criado automaticamente pela camada de aplicação ao servir
      `GET /api/alunos/{id}/dados-sensiveis`.
    """

    __tablename__ = "audit_log"  # type: ignore[assignment]

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )

    user_id: uuid.UUID = Field(
        nullable=False,
        index=True,
        description="FK lógica para users.id — quem acessou.",
    )

    student_id: uuid.UUID = Field(
        nullable=False,
        index=True,
        description="FK lógica para students.id — de quem foram acessados os dados.",
    )

    field_accessed: str = Field(
        max_length=100,
        nullable=False,
        description="Nome do campo sensível acessado (ex: 'diagnostico').",
    )

    accessed_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
        description="Timestamp UTC do acesso.",
    )

    ip_address: str | None = Field(
        default=None,
        max_length=45,
        description="Endereço IP do cliente (IPv4 ou IPv6, opcional).",
    )
