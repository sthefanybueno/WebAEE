"""
Sistema AEE — Domínio: Report e ReportTemplate
===============================================
Tipos de relatório são cadastrados dinamicamente como `ReportTemplate`.
Cada `Report` é uma instância de um template específico.

[DDD] Report é uma entidade RICA com métodos que encapsulam
regras de finalização (travar), edição e conflito offline.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Optional, Dict, List, Union

from pydantic import BaseModel, Field

from app.domain.value_objects.sync_status import SyncStatus  # fonte única de verdade


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ReportTemplate(BaseModel):
    """Template configurável de relatório.

    As `secoes` são um array JSONB — a estrutura de campos de cada seção
    fica no banco, permitindo alterar formulários sem redeploy.
    O campo `versao` cresce a cada alteração; relatórios congelam
    o snapshot da versão usada na criação.

    `papeis_com_acesso` define quais papéis podem visualizar relatórios
    deste tipo (ex: ["prof_aee", "coordenacao"]). Lista vazia = sem restrição.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    nome: str = Field(description="Nome do tipo de relatório (ex: PDI, Diário).")
    descricao: str = Field(description="Descrição detalhada sobre o que é este relatório.")
    secoes: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = Field(default=None, description="Array JSONB de seções e campos configuráveis.")
    papeis_com_acesso: List[str] = Field(default_factory=list, description="Lista de papéis que podem visualizar relatórios deste tipo. Vazio = todos.")
    versao: int = Field(default=1, description="Versão do template. Incrementa a cada alteração estrutural.")
    ativo: bool = Field(default=True)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)

    def papel_pode_visualizar(self, papel: str) -> bool:
        """Verifica se um papel pode visualizar relatórios deste tipo.

        Regra de negócio: se papeis_com_acesso estiver vazio, todos podem ver.
        Admin e Coordenação sempre têm acesso.

        Args:
            papel: Papel do usuário (ex: 'prof_apoio').

        Returns:
            True se o papel tem acesso.
        """
        if not self.papeis_com_acesso:
            return True
        if papel in ("admin", "coordenacao"):
            return True
        return papel in self.papeis_com_acesso


class Report(BaseModel):
    """Relatório pedagógico.

    `template_snapshot`: congela a estrutura do template no momento da criação,
    isolando o relatório de futuras mudanças de template.

    `conflict_flag`: True quando o merge offline detecta colisão de versão.
    A UI exibe as duas versões para o usuário resolver manualmente.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    template_id: uuid.UUID = Field(description="FK lógica para report_templates.id indicando o tipo do relatório.")
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

    def atualizar_conteudo(self, conteudo: dict, user_id: uuid.UUID) -> None:
        """Atualiza o conteúdo do relatório com rastreabilidade completa.

        Encapsula atomicamente: validação de estado travado + atualização
        de conteúdo + rastreamento de quem editou + timestamp UTC.

        [DDD] Esta é a forma correta de atualizar um relatório — o Use Case
        deve chamar este método em vez de manipular campos diretamente.
        Isso garante que NUNCA seja possível alterar o conteúdo sem registrar
        `updated_by` e `updated_at`, e sem verificar o estado `travado`.

        Args:
            conteudo: Novo conteúdo JSON do relatório.
            user_id: ID do usuário que está realizando a edição.

        Raises:
            RelatorioTravadoError: se o relatório já estiver finalizado.
        """
        from app.domain.exceptions import RelatorioTravadoError  # noqa: PLC0415

        if self.travado:
            raise RelatorioTravadoError()

        self.conteudo_json = conteudo
        self.updated_by = user_id
        self.updated_at = _utcnow()

