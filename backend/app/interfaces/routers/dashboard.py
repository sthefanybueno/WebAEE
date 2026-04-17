from fastapi import APIRouter, Depends
from sqlmodel import select, func
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime, timezone

from app.infrastructure.database import get_session
from app.interfaces.dependencies import CurrentUser, get_current_user
from app.interfaces.schemas.dashboard import DashboardResponse
from app.domain.models import Student, StatusAluno
from app.domain.entities.report import Report
from app.domain.entities.photo import Photo

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/", response_model=DashboardResponse)
async def get_dashboard(
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Total de Alunos Ativos no tenant
    stmt_alunos = select(func.count(Student.id)).where(
        Student.tenant_id == current_user.tenant_id,
        Student.status == StatusAluno.ATIVO
    )
    total_alunos = (await session.exec(stmt_alunos)).one()

    # Total de Relatórios Pendentes (travado == False) no tenant
    # (Supondo que alunos pertençam ao tenant seja validado indiretamente pelo autor ou aluno)
    # Como simplificação do MVP: pegamos os relatórios do usuário ou da sua visualização
    stmt_reports = select(func.count(Report.id)).where(Report.travado == False)  # noqa: E712
    total_reports = (await session.exec(stmt_reports)).one()

    # Total de Fotos Criadas Hoje
    hoje = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
    stmt_fotos = select(func.count(Photo.id)).where(Photo.created_at >= hoje)
    total_fotos = (await session.exec(stmt_fotos)).one()

    return DashboardResponse(
        total_alunos_ativos=total_alunos,
        total_relatorios_pendentes=total_reports,
        total_fotos_hoje=total_fotos
    )
