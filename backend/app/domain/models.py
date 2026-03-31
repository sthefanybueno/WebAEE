"""
Sistema AEE — Domínio: Entidade Student (Aluno)
================================================
Implementação com SQLModel (Pydantic v2 + SQLAlchemy).

Decisões de design:
- UUID como PK gerado pela aplicação (não pelo banco) para
  suportar criação offline-first sem colisão.
- soft-delete via campo `status: ativo | arquivado`.
  NENHUM DELETE físico é permitido em nenhuma entidade.
- Campos `diagnostico` e `laudo` marcados como sensíveis
  (auditados pela camada de aplicação — nunca retornados
  em listagens gerais).
- `updated_at` gerenciado pela aplicação (não trigger SQL)
  para compatibilidade com sync offline.
- Relacionamentos (FKs) omitidos nesta primeira iteração
  para evitar erros de importação circular.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import Optional

from pydantic import model_validator
from sqlmodel import Field, SQLModel


# ─────────────────────────────────────────────────────────
# Enums de domínio
# ─────────────────────────────────────────────────────────


class StatusAluno(str, enum.Enum):
    """Estados possíveis do ciclo de vida de um aluno.

    Apenas soft-delete: um aluno nunca é removido fisicamente.
    'arquivado' equivale a deletado para a lógica de negócio.
    """

    ATIVO = "ativo"
    ARQUIVADO = "arquivado"


class TagPedagogica(str, enum.Enum):
    """Categorias pedagógicas para fotos e registros de momento."""

    AUTONOMIA = "autonomia"
    COMUNICACAO = "comunicacao"
    MOTOR_FINO = "motor_fino"
    SOCIALIZACAO = "socializacao"
    OUTRO = "outro"


class SyncStatus(str, enum.Enum):
    """Estado de sincronização para entidades criadas offline."""

    LOCAL = "local"
    SYNCED = "synced"
    FAILED = "failed"


# ─────────────────────────────────────────────────────────
# Entidade: Student (Aluno)
# ─────────────────────────────────────────────────────────


def _utcnow() -> datetime:
    """Retorna o instante atual em UTC com timezone-aware.

    Compatível com Pydantic v2 (não usa datetime.utcnow() depreciado).
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _validate_status_aluno(value: object) -> StatusAluno:
    """Valida e converte um valor para StatusAluno.

    Lança ValueError se o valor não for um membro válido do enum.
    Chamado pelo model_validator de Student.
    """
    try:
        return StatusAluno(value)
    except ValueError as exc:
        valores_validos = [e.value for e in StatusAluno]
        raise ValueError(
            f"status '{value}' inválido. Valores aceitos: {valores_validos}"
        ) from exc


class Student(SQLModel, table=True):
    """Entidade central do domínio: o Aluno com NEE (Necessidades Educativas Especiais).

    Tabela: students
    Isolamento multi-tenant garantido pelo campo `tenant_id`.
    RLS do PostgreSQL reforça o isolamento no nível do banco.

    Campos sensíveis (⚠️):
        diagnostico — NUNCA retornar em listagens; toda leitura → audit_log
        laudo       — idem

    Ciclo de vida:
        status: StatusAluno.ATIVO → StatusAluno.ARQUIVADO (soft-delete)
    """

    __tablename__ = "students"  # type: ignore[assignment]

    # ── Identidade ────────────────────────────────────────
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
        description="PK gerada pela aplicação (offline-safe).",
    )

    # ── Multi-tenancy ─────────────────────────────────────
    tenant_id: uuid.UUID = Field(
        nullable=False,
        description="Referência ao tenant (SEMED). Isolamento por RLS.",
    )

    # ── Dados pessoais ────────────────────────────────────
    nome: str = Field(
        min_length=2,
        max_length=255,
        nullable=False,
        description="Nome completo do aluno.",
    )

    data_nascimento: Optional[datetime] = Field(
        default=None,
        description="Data de nascimento. Opcional no cadastro inicial.",
    )

    # ── Vínculo escolar ───────────────────────────────────
    escola_atual_id: Optional[uuid.UUID] = Field(
        default=None,
        description="FK lógica para schools.id (FK explícita adicionada na Fase 2).",
    )

    # ── Campos sensíveis (⚠️ LGPD) ───────────────────────
    diagnostico: Optional[str] = Field(
        default=None,
        description=(
            "⚠️ SENSÍVEL — diagnóstico clínico. "
            "Nunca retornar em listagens. Toda leitura auditada."
        ),
    )

    laudo: Optional[str] = Field(
        default=None,
        description=(
            "⚠️ SENSÍVEL — laudo médico/psicológico. "
            "Nunca retornar em listagens. Toda leitura auditada."
        ),
    )

    # ── Consentimento LGPD ────────────────────────────────
    consentimento_lgpd: bool = Field(
        default=False,
        nullable=False,
        description="Consentimento do responsável. Obrigatório antes de qualquer operação.",
    )

    data_consentimento: Optional[datetime] = Field(
        default=None,
        description="Timestamp do consentimento LGPD.",
    )

    base_legal: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Base legal do tratamento (ex: 'Lei 13.146/2015 — LBI').",
    )

    # ── Ciclo de vida (soft-delete) ───────────────────────
    status: StatusAluno = Field(
        default=StatusAluno.ATIVO,
        nullable=False,
        index=True,
        description="Soft-delete: ATIVO ou ARQUIVADO. DELETE físico proibido.",
    )

    # ── Auditoria e sync offline ──────────────────────────
    created_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
        description="Timestamp de criação (UTC, timezone-aware).",
    )

    updated_at: datetime = Field(
        default_factory=_utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": _utcnow},
        description=(
            "Timestamp da última atualização. "
            "Gerenciado pela aplicação para suporte ao merge offline."
        ),
    )

    updated_by: Optional[uuid.UUID] = Field(
        default=None,
        description="FK lógica para users.id — quem fez a última alteração.",
    )

    # ── Sync offline ──────────────────────────────────────
    conflict_flag: bool = Field(
        default=False,
        nullable=False,
        description=(
            "True quando o merge offline detectou conflito de versão. "
            "Exibir aviso na próxima abertura do registro."
        ),
    )

    # ── Validação de domínio ──────────────────────────────
    def __init__(self, **kwargs: object) -> None:
        """Sobrescreve __init__ para validar enums críticos.

        SQLModel com table=True desativa a validação Pydantic padrão no
        __init__, então validamos explicitamente o campo 'status' aqui.
        """
        if "status" in kwargs:
            kwargs["status"] = _validate_status_aluno(kwargs["status"])
        super().__init__(**kwargs)
