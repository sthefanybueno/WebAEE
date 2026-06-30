from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from sqlmodel import col, func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.domain.models import StatusAluno
from app.infrastructure.database import get_session
from app.infrastructure.orm_models.photo_orm import PhotoORM
from app.infrastructure.orm_models.report_orm import ReportORM
from app.infrastructure.orm_models.student_orm import StudentORM
from app.interfaces.dependencies import CurrentUser, get_current_user
from app.interfaces.schemas.dashboard import DashboardResponse

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/", response_model=DashboardResponse)
async def get_dashboard(
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Total de Alunos Ativos no tenant
    stmt_alunos = select(func.count(col(StudentORM.id))).where(
        StudentORM.tenant_id == current_user.tenant_id,
        StudentORM.status == StatusAluno.ATIVO.value
    )
    total_alunos = (await session.exec(stmt_alunos)).one()

    # Total de Relatórios Pendentes (travado == False) no tenant
    stmt_reports = select(func.count(col(ReportORM.id))).where(ReportORM.travado == False)  # noqa: E712
    total_reports = (await session.exec(stmt_reports)).one()

    # Total de Fotos Criadas Hoje
    hoje = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
    stmt_fotos = select(func.count(col(PhotoORM.id))).where(PhotoORM.created_at >= hoje)
    total_fotos = (await session.exec(stmt_fotos)).one()

    # Buscar os últimos 5 alunos cadastrados
    stmt_recent_students = select(StudentORM).where(
        StudentORM.tenant_id == current_user.tenant_id
    ).order_by(StudentORM.created_at.desc()).limit(5)
    recent_students = (await session.exec(stmt_recent_students)).all()

    # Buscar os últimos 5 relatórios criados
    stmt_recent_reports = select(ReportORM, StudentORM).join(
        StudentORM, ReportORM.aluno_id == StudentORM.id
    ).where(
        StudentORM.tenant_id == current_user.tenant_id
    ).order_by(ReportORM.created_at.desc()).limit(5)
    recent_reports = (await session.exec(stmt_recent_reports)).all()

    # Buscar as últimas 5 fotos enviadas
    stmt_recent_photos = select(PhotoORM, StudentORM).join(
        StudentORM, PhotoORM.aluno_id == StudentORM.id
    ).where(
        StudentORM.tenant_id == current_user.tenant_id
    ).order_by(PhotoORM.created_at.desc()).limit(5)
    recent_photos = (await session.exec(stmt_recent_photos)).all()

    activities = []
    
    for student in recent_students:
        activities.append({
            "id": f"student-{student.id}",
            "type": "aluno",
            "description": f"Aluno(a) {student.nome} foi cadastrado(a).",
            "created_at": student.created_at
        })
        
    for report, student in recent_reports:
        activities.append({
            "id": f"report-{report.id}",
            "type": "relatorio",
            "description": f"Relatório criado para o(a) aluno(a) {student.nome}.",
            "created_at": report.created_at
        })
        
    for photo, student in recent_photos:
        tag_desc = photo.tag.value if hasattr(photo.tag, 'value') else str(photo.tag)
        activities.append({
            "id": f"photo-{photo.id}",
            "type": "foto",
            "description": f"Novo momento registrado para o(a) aluno(a) {student.nome} ({tag_desc}).",
            "created_at": photo.created_at
        })
        
    # Ordenar por data decrescente e pegar os 5 mais recentes
    activities.sort(key=lambda x: x["created_at"], reverse=True)
    recent_activities = activities[:5]

    return DashboardResponse(
        total_alunos_ativos=total_alunos,
        total_relatorios_pendentes=total_reports,
        total_fotos_hoje=total_fotos,
        recent_activities=recent_activities
    )
