# Import all ORM models here so SQLModel.metadata is populated
from sqlmodel import SQLModel

from app.infrastructure.orm_models.tenant_orm import TenantORM
from app.infrastructure.orm_models.school_orm import SchoolORM
from app.infrastructure.orm_models.user_orm import UserORM
from app.infrastructure.orm_models.student_orm import StudentORM
from app.infrastructure.orm_models.report_orm import ReportORM, ReportTemplateORM
from app.infrastructure.orm_models.photo_orm import PhotoORM
from app.infrastructure.orm_models.audit_log_orm import AuditLogORM
from app.infrastructure.orm_models.professor_assignment_orm import ProfessorAssignmentORM
from app.infrastructure.orm_models.student_history_orm import StudentSchoolHistoryORM

__all__ = [
    "SQLModel",
    "TenantORM",
    "SchoolORM",
    "UserORM",
    "StudentORM",
    "ReportORM",
    "ReportTemplateORM",
    "PhotoORM",
    "AuditLogORM",
    "ProfessorAssignmentORM",
    "StudentSchoolHistoryORM",
]
