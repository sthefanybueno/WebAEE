import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.application.use_cases.reports.create_report import (
    CreateReportInput,
    CreateReportUseCase,
)
from app.application.use_cases.reports.list_templates import ListTemplatesUseCase, ListTemplatesInput
from app.application.use_cases.reports.create_report_template import (
    CreateReportTemplateInput,
    CreateReportTemplateUseCase,
)
from app.application.use_cases.reports.list_reports_by_template import ListReportsByTemplateUseCase
from app.infrastructure.database import get_session
from app.infrastructure.repositories.report_repository_impl import (
    SQLModelReportRepository,
)
from app.infrastructure.unit_of_work_impl import SQLAlchemyUnitOfWork
from app.infrastructure.repositories.report_template_repository_impl import (
    SQLModelReportTemplateRepository,
)
from app.infrastructure.repositories.student_repository_impl import (
    SQLModelStudentRepository,
)
from app.interfaces.dependencies import CurrentUser, get_current_user
from app.interfaces.schemas.report import CreateReportRequest, ReportResponse, ReportTemplateResponse, ReportDetailResponse, UpdateReportRequest, SyncReportRequest, AddCommentRequest, CreateReportTemplateRequest
from app.domain.exceptions import (
    DomainException,
    AlunoNaoEncontradoError,
    RelatorioNaoEncontradoError,
    TenantMismatchError,
    PermissaoInsuficienteError,
    RelatorioTravadoError,
    ConflitoSincronizacaoError,
)

router = APIRouter(prefix="/api/relatorios", tags=["relatorios"])

_DOMAIN_TO_HTTP: dict[type, int] = {
    AlunoNaoEncontradoError: status.HTTP_404_NOT_FOUND,
    RelatorioNaoEncontradoError: status.HTTP_404_NOT_FOUND,
    TenantMismatchError: status.HTTP_403_FORBIDDEN,
    PermissaoInsuficienteError: status.HTTP_403_FORBIDDEN,
    RelatorioTravadoError: status.HTTP_409_CONFLICT,
    ConflitoSincronizacaoError: status.HTTP_409_CONFLICT,
}

def _handle_domain_exception(e: DomainException) -> None:
    status_code = _DOMAIN_TO_HTTP.get(type(e), status.HTTP_400_BAD_REQUEST)
    raise HTTPException(status_code=status_code, detail=str(e))


def get_create_report_use_case(session: AsyncSession = Depends(get_session)) -> CreateReportUseCase:
    return CreateReportUseCase(
        uow=SQLAlchemyUnitOfWork(session),
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
        template_id=request.template_id,
        aluno_id=request.aluno_id,
        autor_id=current_user.id,
        tenant_id=current_user.tenant_id,
        papel_autor=current_user.papel,
        conteudo_json=request.conteudo_json,
    )
    try:
        report = await use_case.execute(input_dto)
        return report
    except DomainException as e:
        _handle_domain_exception(e)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

from app.application.use_cases.reports.list_reports_by_student import (
    ListReportsByStudentUseCase,
    ListReportsByStudentInput,
)


def get_list_reports_by_student_use_case(
    session: AsyncSession = Depends(get_session),
) -> ListReportsByStudentUseCase:
    return ListReportsByStudentUseCase(
        report_repo=SQLModelReportRepository(session),
        student_repo=SQLModelStudentRepository(session),
    )


@router.get("/aluno/{student_id}", response_model=List[ReportResponse])
async def list_reports_by_student(
    student_id: uuid.UUID,
    template_id: Optional[uuid.UUID] = None,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: ListReportsByStudentUseCase = Depends(get_list_reports_by_student_use_case),
):
    """Lista relatórios de um aluno. Verificação de tenant delegada ao Use Case."""
    try:
        return await use_case.execute(ListReportsByStudentInput(
            student_id=student_id,
            tenant_id=current_user.tenant_id,
            template_id=template_id,
        ))
    except DomainException as e:
        _handle_domain_exception(e)

from datetime import datetime, timezone
from app.domain.entities.report import ReportTemplate

def get_list_templates_use_case(
    session: AsyncSession = Depends(get_session),
) -> ListTemplatesUseCase:
    return ListTemplatesUseCase(
        uow=SQLAlchemyUnitOfWork(session),
        template_repo=SQLModelReportTemplateRepository(session),
    )


@router.get("/templates", response_model=List[ReportTemplateResponse])
async def list_templates(
    current_user: CurrentUser = Depends(get_current_user),
    use_case: ListTemplatesUseCase = Depends(get_list_templates_use_case),
):
    """Lista templates globais ativos do sistema.

    Templates são configurações globais (não isoladas por tenant).
    O router delega ao ListTemplatesUseCase — nenhum ORM aqui.
    """
    return await use_case.execute(ListTemplatesInput(papel_usuario=current_user.papel))

@router.get("/templates/{template_id}", response_model=ReportTemplateResponse)
async def get_template(
    template_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
):
    repo = SQLModelReportTemplateRepository(session)
    template = await repo.get_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template não encontrado")
    return template

def get_create_report_template_use_case(
    session: AsyncSession = Depends(get_session),
) -> CreateReportTemplateUseCase:
    return CreateReportTemplateUseCase(
        uow=SQLAlchemyUnitOfWork(session),
        template_repo=SQLModelReportTemplateRepository(session),
    )

@router.post("/templates", response_model=ReportTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    request: CreateReportTemplateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: CreateReportTemplateUseCase = Depends(get_create_report_template_use_case),
):
    """Cria um novo template de relatório."""
    input_dto = CreateReportTemplateInput(
        nome=request.nome,
        descricao=request.descricao,
        secoes=request.secoes,
        papeis_com_acesso=request.papeis_com_acesso,
        papel_autor=current_user.papel,
    )
    try:
        return await use_case.execute(input_dto)
    except DomainException as e:
        _handle_domain_exception(e)

def get_list_reports_by_template_use_case(
    session: AsyncSession = Depends(get_session),
) -> ListReportsByTemplateUseCase:
    return ListReportsByTemplateUseCase(
        repository=SQLModelReportRepository(session),
    )

@router.get("/template/{template_id}/relatorios", response_model=List[ReportResponse])
async def list_reports_by_template(
    template_id: uuid.UUID,
    use_case: ListReportsByTemplateUseCase = Depends(get_list_reports_by_template_use_case),
):
    """Lista todos os relatórios de um template específico."""
    return await use_case.execute(template_id=template_id)

from app.application.use_cases.reports.get_report_detail import GetReportDetailUseCase, GetReportDetailInput

def get_report_detail_use_case(session: AsyncSession = Depends(get_session)) -> GetReportDetailUseCase:
    return GetReportDetailUseCase(
        uow=SQLAlchemyUnitOfWork(session),
        report_repo=SQLModelReportRepository(session),
        student_repo=SQLModelStudentRepository(session),
    )

@router.get("/{report_id}", response_model=ReportDetailResponse)
async def get_report(
    report_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: GetReportDetailUseCase = Depends(get_report_detail_use_case)
):
    """
    Retorna o relatório completo detalhado, inclusive injetando o template_snapshot
    congelado para renderização do front-end (RN-21).
    """
    try:
        input_dto = GetReportDetailInput(report_id=report_id, tenant_id=current_user.tenant_id)
        return await use_case.execute(input_dto)
    except DomainException as e:
        _handle_domain_exception(e)

from app.application.use_cases.reports.update_report import UpdateReportUseCase, UpdateReportInput

def get_update_report_use_case(session: AsyncSession = Depends(get_session)) -> UpdateReportUseCase:
    return UpdateReportUseCase(
        uow=SQLAlchemyUnitOfWork(session),
        report_repo=SQLModelReportRepository(session),
        student_repo=SQLModelStudentRepository(session),
    )

@router.put("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: uuid.UUID,
    request: UpdateReportRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: UpdateReportUseCase = Depends(get_update_report_use_case)
):
    """Atualização/Salvamento do payload do relatório."""
    try:
        input_dto = UpdateReportInput(
            report_id=report_id,
            tenant_id=current_user.tenant_id,
            user_id=current_user.id,
            conteudo_json=request.conteudo_json,
        )
        return await use_case.execute(input_dto)
    except DomainException as e:
        _handle_domain_exception(e)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

from app.application.use_cases.reports.sync_report import SyncReportUseCase, SyncReportInput
from app.application.use_cases.reports.add_comment import AddCommentUseCase, AddCommentInput

def get_sync_report_use_case(session: AsyncSession = Depends(get_session)) -> SyncReportUseCase:
    return SyncReportUseCase(
        uow=SQLAlchemyUnitOfWork(session),
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
            template_id=i.template_id,
            aluno_id=i.aluno_id,
            autor_id=current_user.id,
            tenant_id=current_user.tenant_id,
            conteudo_json=i.conteudo_json,
            updated_at_local=i.updated_at_local,
        ) for i in request.items
    ]
    try:
        reports = await use_case.execute(inputs)
        return reports
    except DomainException as e:
        _handle_domain_exception(e)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

def get_add_comment_use_case(session: AsyncSession = Depends(get_session)) -> AddCommentUseCase:
    return AddCommentUseCase(
        uow=SQLAlchemyUnitOfWork(session),
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
    except DomainException as e:
        _handle_domain_exception(e)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

