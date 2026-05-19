"""
Sistema AEE — Value Objects do Domínio
========================================
Re-exports centralizados.

    from app.domain.value_objects import Email, SyncStatus
"""

from app.domain.value_objects.email import Email
from app.domain.value_objects.sync_status import SyncStatus

__all__ = ["Email", "SyncStatus"]
