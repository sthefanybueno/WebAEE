import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.domain.models import Student
from app.domain.entities.report import Report
from app.infrastructure.database import get_session
from app.infrastructure.repositories.report_repository_impl import SQLModelReportRepository
from app.interfaces.dependencies import CurrentUser, get_current_user
from app.interfaces.schemas.sync import SyncPullResponse, ResolveConflictRequest

router = APIRouter(prefix="/api/sync", tags=["sync"])

@router.get("/pull", response_model=SyncPullResponse)
async def sync_pull(
    last_sync: datetime = Query(..., description="Timestamp da última sincronização bem-sucedida pelo cliente."),
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Retorna todos os dados que foram modificados **após** o `last_sync` 
    para o tenant do usuário, habilitando o carregamento rápido offline-first.
    """
    if last_sync.tzinfo is not None:
        last_sync = last_sync.astimezone(timezone.utc).replace(tzinfo=None)
        
    # Alunos
    stmt_alunos = select(Student).where(
        Student.tenant_id == current_user.tenant_id,
        Student.updated_at > last_sync
    )
    result_alunos = await session.exec(stmt_alunos)
    alunos_atualizados = result_alunos.all()

    # Relatórios
    stmt_relatorios = select(Report).join(Student, Report.aluno_id == Student.id).where(
        Student.tenant_id == current_user.tenant_id,
        Report.updated_at > last_sync
    )
    result_relatorios = await session.exec(stmt_relatorios)
    relatorios_atualizados = result_relatorios.all()

    return {
        "last_sync": datetime.now(timezone.utc).replace(tzinfo=None),
        "alunos": alunos_atualizados,
        "relatorios": relatorios_atualizados
    }

@router.post("/reports/resolve", response_model=dict)
async def resolve_report_conflict(
    request: ResolveConflictRequest,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Força a resolução de um conflito do PWA sobrepondo o payload atual no DB.
    """
    repo = SQLModelReportRepository(session)
    report = await repo.get_by_id(request.report_id)
    
    if not report:
        raise HTTPException(status_code=404, detail="Relatório não encontrado")
        
    from app.infrastructure.repositories.student_repository_impl import SQLModelStudentRepository
    student_repo = SQLModelStudentRepository(session)
    student = await student_repo.get_by_id(report.aluno_id)
    if not student or student.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Relatório não encontrado")
    
    # Aplica o conteúdo resolvido
    report.conteudo_json = request.resolved_content
    # Atualiza o timestamp (vai pro pull depois e atualiza clientes passivos)
    report.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # Remove a tag de conflito
    report.conflict_flag = False
    
    await repo.save(report)
    
    return {"message": "Conflito resolvido e sincronizado", "report_id": report.id}
