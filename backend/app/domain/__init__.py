"""
Sistema AEE — Pacote de Domínio
================================
Re-exports centralizados para uso interno.

De fora do pacote domain, importe sempre desta raiz:
    from app.domain import Student, StatusAluno, TagPedagogica
"""

from app.domain.models import StatusAluno, Student, SyncStatus, TagPedagogica
from app.domain.entities.tenant import Tenant
from app.domain.entities.user import PapelUsuario, User
from app.domain.entities.school import School
from app.domain.entities.report import Report, ReportTemplate, TipoRelatorio
from app.domain.entities.photo import Photo
from app.domain.entities.professor_assignment import ProfessorAssignment
from app.domain.entities.audit_log import AuditLog, SENSITIVE_FIELDS

__all__ = [
    # models.py (entidade principal + enums)
    "Student",
    "StatusAluno",
    "TagPedagogica",
    "SyncStatus",
    # entities/
    "Tenant",
    "PapelUsuario",
    "User",
    "School",
    "Report",
    "ReportTemplate",
    "TipoRelatorio",
    "Photo",
    "ProfessorAssignment",
    "AuditLog",
    "SENSITIVE_FIELDS",
]
