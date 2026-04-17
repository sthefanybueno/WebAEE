import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.use_cases.reports.create_report import (
    CreateReportInput,
    CreateReportUseCase,
)
from app.domain.entities.report import TipoRelatorio
from app.infrastructure.database import get_session
from app.infrastructure.repositories.report_repository_impl import (
    SQLModelReportRepository,
)
from app.infrastructure.repositories.report_template_repository_impl import (
    SQLModelReportTemplateRepository,
)
from app.infrastructure.repositories.student_repository_impl import (
    SQLModelStudentRepository,
)
from app.interfaces.dependencies import CurrentUser, get_current_user
from app.interfaces.schemas.report import CreateReportRequest, ReportResponse

router = APIRouter(prefix="/api/relatorios", tags=["relatorios"])

def get_create_report_use_case(session: AsyncSession = Depends(get_session)) -> CreateReportUseCase:
    return CreateReportUseCase(
        session=session,
        report_repo=SQLModelReportRepository(session),
        template_repo=SQLModelReportTemplateRepository(session),
        student_repo=SQLModelStudentRepository(session),
    )

@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    request: CreateReportRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: CreateReportUseCase = Depends(get_create_report_use_case),
):
    input_dto = CreateReportInput(
        tipo=request.tipo,
        aluno_id=request.aluno_id,
        autor_id=current_user.id,
        tenant_id=current_user.tenant_id,
        papel_autor=current_user.papel,
        conteudo_json=request.conteudo_json,
    )
    try:
        report = await use_case.execute(input_dto)
        return report
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/aluno/{student_id}", response_model=List[ReportResponse])
async def list_reports_by_student(
    student_id: uuid.UUID,
    tipo: Optional[TipoRelatorio] = None,
    session: AsyncSession = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    student_repo = SQLModelStudentRepository(session)
    student = await student_repo.get_by_id(student_id)
    if not student or student.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Estudante não encontrado")

    repo = SQLModelReportRepository(session)
    reports = await repo.list_by_student(student_id, tipo)
    return reports

from app.interfaces.schemas.report import ReportTemplateResponse, ReportDetailResponse, UpdateReportRequest
from datetime import datetime, timezone
from app.domain.entities.report import ReportTemplate

@router.get("/templates", response_model=List[ReportTemplateResponse])
async def list_templates(
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Lista templates globais ativos do sistema ou do tenant."""
    from sqlmodel import select
    statement = select(ReportTemplate)
    result = await session.exec(statement)
    templates = result.all()
    return list(templates)

@router.get("/{report_id}", response_model=ReportDetailResponse)
async def get_report(
    report_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Retorna o relatório completo detalhado, inclusive injetando o template_snapshot
    congelado para renderização do front-end (RN-21).
    """
    repo = SQLModelReportRepository(session)
    report = await repo.get_by_id(report_id)
    
    if not report:
        raise HTTPException(status_code=404, detail="Relatório não encontrado")
        
    student_repo = SQLModelStudentRepository(session)
    student = await student_repo.get_by_id(report.aluno_id)
    if not student or student.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Relatório não encontrado")
        
    return report

@router.put("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: uuid.UUID,
    request: UpdateReportRequest,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Atualização/Salvamento do payload do relatório."""
    repo = SQLModelReportRepository(session)
    report = await repo.get_by_id(report_id)
    
    if not report:
        raise HTTPException(status_code=404, detail="Relatório não encontrado")
        
    student_repo = SQLModelStudentRepository(session)
    student = await student_repo.get_by_id(report.aluno_id)
    if not student or student.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Relatório não encontrado")
    
    # Atualiza dados dinâmicos do JSON
    report.conteudo_json = request.conteudo_json
    report.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    
    saved = await repo.save(report)
    return saved

from app.application.use_cases.reports.sync_report import SyncReportUseCase, SyncReportInput
from app.application.use_cases.reports.add_comment import AddCommentUseCase, AddCommentInput
from app.interfaces.schemas.report import SyncReportRequest, AddCommentRequest

def get_sync_report_use_case(session: AsyncSession = Depends(get_session)) -> SyncReportUseCase:
    return SyncReportUseCase(
        session=session,
        report_repo=SQLModelReportRepository(session),
        student_repo=SQLModelStudentRepository(session),
    )

from app.infrastructure.rate_limit import limiter

@router.post("/sync", response_model=List[ReportResponse])
@limiter.exempt
async def sync_reports(
    request: SyncReportRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: SyncReportUseCase = Depends(get_sync_report_use_case),
):
    inputs = [
        SyncReportInput(
            id=i.id,
            tipo=i.tipo,
            aluno_id=i.aluno_id,
            autor_id=current_user.id,
            tenant_id=current_user.tenant_id,
            conteudo_json=i.conteudo_json,
            updated_at_local=i.updated_at_local,
        ) for i in request.items
    ]
    reports = await use_case.execute(inputs)
    return reports

def get_add_comment_use_case(session: AsyncSession = Depends(get_session)) -> AddCommentUseCase:
    return AddCommentUseCase(
        session=session,
        report_repo=SQLModelReportRepository(session)
    )

@router.post("/{report_id}/comentarios", response_model=ReportResponse)
async def add_comment(
    report_id: uuid.UUID,
    request: AddCommentRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: AddCommentUseCase = Depends(get_add_comment_use_case),
):
    input_dto = AddCommentInput(
        report_id=report_id,
        autor_id=current_user.id,
        executor_papel=current_user.papel,
        texto=request.texto,
    )
    try:
        report = await use_case.execute(input_dto)
        return report
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

