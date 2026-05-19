"""
Sistema AEE — Value Object: SyncStatus
========================================
Fonte única de verdade para o estado de sincronização offline-first.

Anteriormente duplicado em:
  - app/domain/models.py (Student)
  - app/domain/entities/report.py (Report)

Consolidado aqui. Todos os módulos do domínio importam desta localização.
"""

from __future__ import annotations

import enum


class SyncStatus(str, enum.Enum):
    """Estado de sincronização para entidades criadas offline.

    Ciclo de vida:
        LOCAL  → entidade criada offline, ainda não enviada ao servidor.
        SYNCED → sincronização bem-sucedida com o servidor.
        FAILED → tentativa de sync falhou; aguarda reprocessamento.
    """

    LOCAL = "local"
    SYNCED = "synced"
    FAILED = "failed"
