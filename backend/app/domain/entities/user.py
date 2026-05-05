"""
Sistema AEE — Domínio: User (Usuário)
======================================
Qualquer pessoa que faz login no sistema.
O campo `papel` determina as permissões via RBAC.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field

def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class PapelUsuario(str, enum.Enum):
    """Papéis de acesso do sistema AEE.

    Determina o que cada usuário pode ver e editar.
    Aplicado via middleware FastAPI + RLS PostgreSQL.

    Hierarquia de permissões:
        ADMIN        → acesso total ao sistema, gerencia tenants
        COORDENACAO  → gerencia escola, cria usuários do seu tenant
        PROF_AEE     → cria relatórios e vínculos de alunos
        PROF_APOIO   → acompanha alunos, lê relatórios
        PROF_REGENTE → somente leitura de dados não-sensíveis
    """

    ADMIN = "admin"
    COORDENACAO = "coordenacao"
    PROF_AEE = "prof_aee"
    PROF_APOIO = "prof_apoio"
    PROF_REGENTE = "prof_regente"


# Hierarquia de papéis: índice menor = mais poder
_HIERARQUIA_PAPEIS: dict[PapelUsuario, int] = {
    PapelUsuario.ADMIN: 0,
    PapelUsuario.COORDENACAO: 1,
    PapelUsuario.PROF_AEE: 2,
    PapelUsuario.PROF_APOIO: 3,
    PapelUsuario.PROF_REGENTE: 4,
}


class User(BaseModel):
    """Usuário autenticado do sistema.

    Tabela: users
    Papel determina permissões; tenant_id isola os dados.

    [DDD] Esta entidade é RICA: encapsula dados E comportamentos.
    Os métodos de domínio (`desativar`, `pode_criar_usuario`, etc.)
    garantem que as regras RBAC residam aqui e não nos Use Cases.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    tenant_id: uuid.UUID = Field(description="FK lógica para tenants.id.")
    email: str = Field(max_length=255, description="Email único no sistema (login).")
    hashed_password: str = Field(description="Senha com bcrypt. Inicialmente recebe 'PENDING_INVITE' até usuário aceitar convite.")
    nome: str = Field(min_length=2, max_length=255, description="Nome completo do usuário.")
    papel: PapelUsuario = Field(description="Papel RBAC: admin | coordenacao | prof_aee | prof_apoio | prof_regente.")
    ativo: bool = Field(default=True, description="Soft-disable: False bloqueia login sem remover o usuário.")
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)

    # ── Comportamentos de domínio (Entidade Rica) ─────────

    def desativar(self) -> None:
        """Bloqueia o login do usuário sem removê-lo (soft-disable).

        Regra de negócio: usuários não são deletados, apenas desativados.
        Um usuário já inativo não levanta erro — é operação idempotente.
        """
        self.ativo = False
        self.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    def pode_criar_usuario(self, papel_alvo: PapelUsuario) -> bool:
        """Verifica se este usuário tem hierarquia para criar outro com o papel_alvo.

        Regra RBAC: um usuário só pode criar outros com papel de hierarquia
        igual ou inferior ao seu. ADMIN cria qualquer papel; PROF_REGENTE
        não pode criar ninguém.

        Args:
            papel_alvo: Papel do usuário que se deseja criar.

        Returns:
            True se a criação é permitida, False caso contrário.
        """
        # Apenas ADMIN e COORDENACAO podem criar usuários
        if self.papel not in (PapelUsuario.ADMIN, PapelUsuario.COORDENACAO):
            return False

        minha_posicao = _HIERARQUIA_PAPEIS.get(self.papel, 99)
        posicao_alvo = _HIERARQUIA_PAPEIS.get(papel_alvo, 99)

        # Índice menor = mais poder; só pode criar papéis com índice >= ao seu
        return minha_posicao <= posicao_alvo

    def pode_acessar_dados_sensiveis(self) -> bool:
        """Verifica se este usuário pode acessar dados sensíveis (diagnóstico, laudo).

        Regra RBAC: apenas ADMIN, COORDENACAO e PROF_AEE têm acesso
        mediante justificativa obrigatória (LGPD art. 37).

        Returns:
            True se o papel permite o acesso.
        """
        return self.papel in (
            PapelUsuario.ADMIN,
            PapelUsuario.COORDENACAO,
            PapelUsuario.PROF_AEE,
        )
