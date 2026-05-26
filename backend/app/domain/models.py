"""
Sistema AEE — Domínio: models.py (Re-export)
=============================================
Este módulo agora é apenas um ponto de re-export canônico.
A implementação foi movida para eliminar o ciclo de importação:

  - app.domain.entities.student  → Student (entidade rica)
  - app.domain.models_enums      → StatusAluno, TagPedagogica
  - app.domain.value_objects.sync_status → SyncStatus

Todo o código existente que importa de app.domain.models continua
funcionando sem nenhuma alteração nos importadores.
"""

from __future__ import annotations

# ── Re-exports canônicos ───────────────────────────────────────────────────
from app.domain.models_enums import StatusAluno, TagPedagogica  # noqa: F401
from app.domain.value_objects.sync_status import SyncStatus  # noqa: F401
from app.domain.entities.student import Student  # noqa: F401

__all__ = [
    "StatusAluno",
    "TagPedagogica",
    "SyncStatus",
    "Student",
]
