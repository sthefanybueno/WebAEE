"""
Sistema AEE — Enums de Domínio
================================
Módulo isolado para enums do domínio, sem dependências de outras
entidades ou exceções. Isso elimina o ciclo de importação entre
models.py (Student) e exceptions.py (AlunoJaArquivadoError).
"""

from __future__ import annotations

import enum


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
