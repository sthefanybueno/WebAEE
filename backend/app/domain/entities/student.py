"""
Sistema AEE — Domínio: Entidade Student (Aluno)
================================================
Implementação com Pydantic v2.

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

[DDD] Esta entidade é RICA: encapsula dados E comportamentos.
Os métodos de domínio (`arquivar`, `transferir_para`, etc.)
garantem que as regras de negócio residam aqui e não nos Use Cases.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field, model_validator

from app.domain.exceptions import AlunoJaArquivadoError
from app.domain.models_enums import StatusAluno
from app.domain.value_objects.sync_status import SyncStatus  # noqa: F401 — re-exportado via models


def _utcnow() -> datetime:
    """Retorna o instante atual em UTC (naive, sem tzinfo)."""
    return datetime.now(UTC).replace(tzinfo=None)


def _validate_status_aluno(value: object) -> StatusAluno:
    """Valida e converte um valor para StatusAluno."""
    try:
        return StatusAluno(value)
    except ValueError as exc:
        valores_validos = [e.value for e in StatusAluno]
        raise ValueError(
            f"status '{value}' inválido. Valores aceitos: {valores_validos}"
        ) from exc


class Student(BaseModel):
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

    # ── Identidade ────────────────────────────────────────
    id: uuid.UUID = Field(default_factory=uuid.uuid4, description="PK gerada pela aplicação (offline-safe).")
    tenant_id: uuid.UUID = Field(description="Referência ao tenant (SEMED). Isolamento por RLS.")

    # ── Dados pessoais ────────────────────────────────────
    nome: str = Field(min_length=2, max_length=255, description="Nome completo do aluno.")
    data_nascimento: datetime | None = Field(default=None, description="Data de nascimento. Opcional no cadastro inicial.")

    # ── Vínculo escolar ───────────────────────────────────────
    escola_atual_id: uuid.UUID | None = Field(default=None, description="FK lógica para schools.id.")

    # ── Vínculo com professor de apoio (1:1) ─────────────────
    apoio_id: uuid.UUID | None = Field(default=None, description="FK lógica para users.id — professor de apoio designado.")

    # ── Campos sensíveis (⚠️ LGPD) ───────────────────────
    diagnostico: str | None = Field(default=None, description="⚠️ SENSÍVEL — diagnóstico clínico.")
    laudo: str | None = Field(default=None, description="⚠️ SENSÍVEL — laudo médico/psicológico.")

    # ── Consentimento LGPD ────────────────────────────────
    consentimento_lgpd: bool = Field(default=False, description="Consentimento do responsável.")
    data_consentimento: datetime | None = Field(default=None)
    base_legal: str | None = Field(default=None, max_length=255)

    # ── Ciclo de vida (soft-delete) ───────────────────────
    status: StatusAluno = Field(default=StatusAluno.ATIVO, description="Soft-delete: ATIVO ou ARQUIVADO.")

    # ── Auditoria e sync offline ──────────────────────────
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    updated_by: uuid.UUID | None = Field(default=None)
    conflict_flag: bool = Field(default=False)

    # ── Validação de domínio ──────────────────────────────
    @model_validator(mode='before')
    @classmethod
    def validate_status(cls, data: dict[str, Any]) -> dict[str, Any]:
        """Valida enums críticos com Pydantic v2."""
        if isinstance(data, dict) and "status" in data:
            data["status"] = _validate_status_aluno(data["status"])
        return data

    # ── Comportamentos de domínio (Entidade Rica) ─────────

    def pode_ser_editado(self) -> bool:
        """Retorna True se o aluno está ativo e pode receber edições.

        Regra de negócio: alunos arquivados são imutáveis.
        """
        return self.status == StatusAluno.ATIVO

    def arquivar(self, user_id: uuid.UUID) -> None:
        """Aplica soft-delete no aluno (status → ARQUIVADO).

        Raises:
            AlunoJaArquivadoError: se status já for ARQUIVADO.
        """
        if self.status == StatusAluno.ARQUIVADO:
            raise AlunoJaArquivadoError()

        self.status = StatusAluno.ARQUIVADO  # type: ignore[assignment]
        self.updated_by = user_id
        self.updated_at = _utcnow()

    def ativar(self, user_id: uuid.UUID) -> None:
        """Reativa um aluno arquivado (status → ATIVO)."""
        if self.status == StatusAluno.ATIVO:
            return

        self.status = StatusAluno.ATIVO  # type: ignore[assignment]
        self.updated_by = user_id
        self.updated_at = _utcnow()

    def transferir_para(self, nova_escola_id: uuid.UUID, user_id: uuid.UUID) -> None:
        """Muda a escola do aluno mantendo rastreabilidade.

        Raises:
            AlunoJaArquivadoError: se o aluno estiver arquivado.
        """
        if self.status == StatusAluno.ARQUIVADO:
            raise AlunoJaArquivadoError()

        self.escola_atual_id = nova_escola_id
        self.updated_by = user_id
        self.updated_at = _utcnow()

    def registrar_consentimento_lgpd(self, base_legal: str) -> None:
        """Registra o consentimento LGPD do responsável.

        Encapsula a regra: o consentimento exige o flag, o timestamp e
        a base legal registrados juntos — nunca parcialmente.
        """
        self.consentimento_lgpd = True
        self.data_consentimento = _utcnow()
        self.base_legal = base_legal
