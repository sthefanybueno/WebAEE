"""
Sistema AEE — Pacote de Domínio
================================
Re-exports centralizados para uso interno.

De fora do pacote domain, importe sempre desta raiz:
    from app.domain import Student, StatusAluno, TagPedagogica
    from app.domain import AlunoNaoEncontradoError, DomainException
"""

from app.domain.models import StatusAluno, Student, SyncStatus, TagPedagogica
from app.domain.entities.tenant import Tenant
from app.domain.entities.user import PapelUsuario, User
from app.domain.entities.school import School
from app.domain.entities.report import Report, ReportTemplate
from app.domain.entities.photo import Photo
from app.domain.entities.professor_assignment import ProfessorAssignment
from app.domain.entities.audit_log import AuditLog, SENSITIVE_FIELDS
from app.domain.value_objects.email import Email
from app.domain.value_objects.sync_status import SyncStatus  # re-export canônico
from app.domain.exceptions import (
    DomainException,
    AlunoNaoEncontradoError,
    UsuarioNaoEncontradoError,
    EscolaNaoEncontradaError,
    TenantMismatchError,
    PermissaoInsuficienteError,
    AlunoJaArquivadoError,
    RelatorioTravadoError,
    ConsentimentoLGPDAusenteError,
    JustificativaInsuficienteError,
)

__all__ = [
    # models.py (entidade principal + enums)
    "Student",
    "StatusAluno",
    "TagPedagogica",
    # entities/
    "Tenant",
    "PapelUsuario",
    "User",
    "School",
    "Report",
    "ReportTemplate",
    "Photo",
    "ProfessorAssignment",
    "AuditLog",
    "SENSITIVE_FIELDS",
    # value_objects/
    "Email",
    "SyncStatus",
    # exceptions/
    "DomainException",
    "AlunoNaoEncontradoError",
    "UsuarioNaoEncontradoError",
    "EscolaNaoEncontradaError",
    "TenantMismatchError",
    "PermissaoInsuficienteError",
    "AlunoJaArquivadoError",
    "RelatorioTravadoError",
    "ConsentimentoLGPDAusenteError",
    "JustificativaInsuficienteError",
]
