"""
Sistema AEE — Domínio: Report e ReportTemplate
===============================================
Três tipos de relatório compartilham a mesma tabela `reports`,
discriminados pelo campo `tipo`.

Tipos:
  - aee        → criado pela Prof. AEE
  - anual      → Prof. AEE ou Profissional de Apoio
  - trimestral → Prof. AEE ou Professora Regente

[DDD] Report é uma entidade RICA com métodos que encapsulam
regras de finalização (travar), edição e conflito offline.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import Any, Optional, Dict, List

from pydantic import BaseModel, Field

import os
# JSON fallback handled in ORM now.


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class TipoRelatorio(str, enum.Enum):
    """Discriminador de tipo de relatório."""

    AEE = "aee"
    ANUAL = "anual"
    TRIMESTRAL = "trimestral"


class SyncStatus(str, enum.Enum):
    """Estado de sincronização do relatório."""

    LOCAL = "local"
    SYNCED = "synced"
    FAILED = "failed"


class ReportTemplate(BaseModel):
    """Template configurável de relatório.

    As `secoes` são um array JSONB — a estrutura de campos de cada seção
    fica no banco, permitindo alterar formulários sem redeploy.
    O campo `versao` cresce a cada alteração; relatórios congelam
    o snapshot da versão usada na criação.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    tipo: TipoRelatorio = Field(description="Tipo de relatório que este template descreve.")
    secoes: Optional[List[Dict[str, Any]]] = Field(default=None, description="Array JSONB de seções e campos configuráveis.")
    versao: int = Field(default=1, description="Versão do template. Incrementa a cada alteração estrutural.")
    ativo: bool = Field(default=True)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class Report(BaseModel):
    """Relatório pedagógico.

    `template_snapshot`: congela a estrutura do template no momento da criação,
    isolando o relatório de futuras mudanças de template.

    `conflict_flag`: True quando o merge offline detecta colisão de versão.
    A UI exibe as duas versões para o usuário resolver manualmente.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    tipo: TipoRelatorio = Field(description="Discriminador: aee | anual | trimestral.")
    aluno_id: uuid.UUID = Field(description="FK lógica para students.id.")
    autor_id: uuid.UUID = Field(description="FK lógica para users.id.")
    template_snapshot: Optional[Dict[str, Any]] = Field(default=None, description="Snapshot do template no momento da criação (imutável).")
    conteudo_json: Optional[Dict[str, Any]] = Field(default=None, description="Conteúdo preenchido pelo usuário (mutável até travar).")
    travado: bool = Field(default=False, description="True = relatório finalizado; nenhuma edição permitida.")
    sync_status: SyncStatus = Field(default=SyncStatus.SYNCED, description="Estado de sincronização offline.")
    conflict_flag: bool = Field(default=False, description="True quando merge offline detectou conflito de versão.")
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow, description="Usado para detecção de conflito no sync offline.")
    updated_by: Optional[uuid.UUID] = Field(default=None, description="FK lógica para users.id — último editor.")

    # ── Comportamentos de domínio (Entidade Rica) ─────────

    def pode_ser_editado(self) -> bool:
        """Retorna True se o relatório ainda aceita edições.

        Regra de negócio: relatórios travados são imutáveis.
        Use Cases devem chamar este método antes de qualquer alteração.
        """
        return not self.travado

    def travar(self, user_id: uuid.UUID) -> None:
        """Finaliza o relatório, tornando-o imutável.

        Regra de negócio: após travado, nenhuma edição é permitida.
        Representa a assinatura digital do documento pedagógico.

        Args:
            user_id: ID do usuário que finalizou o relatório.

        Raises:
            RelatorioTravadoError: se já estiver travado.
        """
        from app.domain.exceptions import RelatorioTravadoError  # noqa: PLC0415

        if self.travado:
            raise RelatorioTravadoError()

        self.travado = True
        self.updated_by = user_id
        self.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    def registrar_conflito(self) -> None:
        """Sinaliza que houve conflito de versão no merge offline.

        A UI deve exibir aviso para o usuário resolver manualmente.
        Apenas aciona o flag — não sobrescreve o conteúdo.
        """
        self.conflict_flag = True

    def resolver_conflito(self, conteudo_resolvido: dict, user_id: uuid.UUID) -> None:
        """Aplica a resolução manual do conflito de sync offline.

        Args:
            conteudo_resolvido: Conteúdo definitivo escolhido pelo usuário.
            user_id: ID do usuário que resolveu o conflito.

        Raises:
            RelatorioTravadoError: se o relatório já estiver travado.
        """
        from app.domain.exceptions import RelatorioTravadoError  # noqa: PLC0415

        if self.travado:
            raise RelatorioTravadoError()

        self.conteudo_json = conteudo_resolvido
        self.conflict_flag = False
        self.updated_by = user_id
        self.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
