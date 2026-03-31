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
