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

[DDD] Esta entidade é RICA: encapsula dados E comportamentos.
Os métodos de domínio (`arquivar`, `transferir_para`, etc.)
garantem que as regras de negócio residam aqui e não nos Use Cases.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import Optional, Any
from pydantic import BaseModel, Field, model_validator

from app.domain.value_objects.sync_status import SyncStatus  # fonte única de verdade


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



# ─────────────────────────────────────────────────────────
# Entidade: Student (Aluno)
# ─────────────────────────────────────────────────────────


def _utcnow() -> datetime:
    """Retorna o instante atual em UTC.

    Compatível com Pydantic v2 e bancos PostgreSQL sem TIMESTAMPTZ (naive em python, mas conceitualmente UTC).
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
    data_nascimento: Optional[datetime] = Field(default=None, description="Data de nascimento. Opcional no cadastro inicial.")

    # ── Vínculo escolar ───────────────────────────────────
    escola_atual_id: Optional[uuid.UUID] = Field(default=None, description="FK lógica para schools.id (FK explícita adicionada na Fase 2).")

    # ── Campos sensíveis (⚠️ LGPD) ───────────────────────
    diagnostico: Optional[str] = Field(default=None, description="⚠️ SENSÍVEL — diagnóstico clínico. Nunca retornar em listagens. Toda leitura auditada.")
    laudo: Optional[str] = Field(default=None, description="⚠️ SENSÍVEL — laudo médico/psicológico. Nunca retornar em listagens. Toda leitura auditada.")

    # ── Consentimento LGPD ────────────────────────────────
    consentimento_lgpd: bool = Field(default=False, description="Consentimento do responsável. Obrigatório antes de qualquer operação.")
    data_consentimento: Optional[datetime] = Field(default=None, description="Timestamp do consentimento LGPD.")
    base_legal: Optional[str] = Field(default=None, max_length=255, description="Base legal do tratamento (ex: 'Lei 13.146/2015 — LBI').")

    # ── Ciclo de vida (soft-delete) ───────────────────────
    status: StatusAluno = Field(default=StatusAluno.ATIVO, description="Soft-delete: ATIVO ou ARQUIVADO. DELETE físico proibido.")

    # ── Auditoria e sync offline ──────────────────────────
    created_at: datetime = Field(default_factory=_utcnow, description="Timestamp de criação (UTC, timezone-aware).")
    updated_at: datetime = Field(default_factory=_utcnow, description="Timestamp da última atualização. Gerenciado pela aplicação para suporte ao merge offline.")
    updated_by: Optional[uuid.UUID] = Field(default=None, description="FK lógica para users.id — quem fez a última alteração.")

    # ── Sync offline ──────────────────────────────────────
    conflict_flag: bool = Field(default=False, description="True quando o merge offline detectou conflito de versão. Exibir aviso na próxima abertura do registro.")

    # ── Validação de domínio ──────────────────────────────
    @model_validator(mode='before')
    def validate_status(cls, data: dict[str, Any]) -> dict[str, Any]:
        """Validar enums críticos com Pydantic v2."""
        if isinstance(data, dict) and "status" in data:
            data["status"] = _validate_status_aluno(data["status"])
        return data

    # ── Comportamentos de domínio (Entidade Rica) ─────────

    def pode_ser_editado(self) -> bool:
        """Retorna True se o aluno está ativo e pode receber edições.

        Regra de negócio: alunos arquivados são imutáveis.
        Use cases devem chamar este método antes de qualquer modificação.
        """
        return self.status == StatusAluno.ATIVO

    def arquivar(self, user_id: uuid.UUID) -> None:
        """Aplica soft-delete no aluno (status → ARQUIVADO).

        Encapsula a regra de negócio: um aluno só pode ser arquivado
        uma vez. Levanta AlunoJaArquivadoError se já estiver arquivado.

        Args:
            user_id: ID do usuário que executou a operação (rastreabilidade).

        Raises:
            AlunoJaArquivadoError: se status já for ARQUIVADO.
        """
        # Importação local para evitar circular entre domain/ e exceptions
        from app.domain.exceptions import AlunoJaArquivadoError  # noqa: PLC0415

        if self.status == StatusAluno.ARQUIVADO:
            raise AlunoJaArquivadoError()

        self.status = StatusAluno.ARQUIVADO  # type: ignore[assignment]
        self.updated_by = user_id
        self.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    def transferir_para(self, nova_escola_id: uuid.UUID, user_id: uuid.UUID) -> None:
        """Muda a escola do aluno mantendo rastreabilidade.

        Encapsula a regra de negócio da transferência: apenas alunos
        ativos podem ser transferidos.

        Args:
            nova_escola_id: UUID da escola de destino (já validada pelo use case).
            user_id: ID do usuário executor (rastreabilidade).

        Raises:
            AlunoJaArquivadoError: se o aluno estiver arquivado.
        """
        from app.domain.exceptions import AlunoJaArquivadoError  # noqa: PLC0415

        if self.status == StatusAluno.ARQUIVADO:
            raise AlunoJaArquivadoError()

        self.escola_atual_id = nova_escola_id
        self.updated_by = user_id
        self.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    def registrar_consentimento_lgpd(self, base_legal: str) -> None:
        """Registra o consentimento LGPD do responsável.

        Encapsula a regra: o consentimento exige tanto o flag booleano
        quanto o timestamp e a base legal registrados juntos — nunca
        parcialmente.

        Args:
            base_legal: Fundamento legal (ex: 'Lei 13.146/2015 — LBI').
        """
        self.consentimento_lgpd = True
        self.data_consentimento = datetime.now(timezone.utc).replace(tzinfo=None)
        self.base_legal = base_legal
