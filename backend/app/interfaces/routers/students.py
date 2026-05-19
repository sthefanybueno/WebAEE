import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.infrastructure.rate_limit import limiter
from sqlmodel.ext.asyncio.session import AsyncSession

from app.domain.models import StatusAluno
from app.domain.exceptions import (
    AlunoNaoEncontradoError,
    AlunoJaArquivadoError,
    ConsentimentoLGPDAusenteError,
    DomainException,
    EscolaNaoEncontradaError,
    JustificativaInsuficienteError,
    TenantMismatchError,
)

from app.application.use_cases.students.archive_student import (
    ArchiveStudentInput,
    ArchiveStudentUseCase,
)
from app.application.use_cases.students.create_student import (
    CreateStudentInput,
    CreateStudentUseCase,
)
from app.application.use_cases.students.transfer_student import (
    TransferStudentInput,
    TransferStudentUseCase,
)
from app.application.use_cases.students.update_student import (
    UpdateStudentInput,
    UpdateStudentUseCase,
)
from app.infrastructure.database import get_session
from app.infrastructure.repositories.audit_log_repository_impl import (
    SQLModelAuditLogRepository,
)
from app.infrastructure.repositories.professor_assignment_repository_impl import (
    SQLModelProfessorAssignmentRepository,
)
from app.infrastructure.repositories.school_repository_impl import (
    SQLModelSchoolRepository,
)
from app.infrastructure.repositories.student_history_repository_impl import (
    SQLModelStudentHistoryRepository,
)
from app.infrastructure.repositories.student_repository_impl import (
    SQLModelStudentRepository,
)
from app.interfaces.dependencies import CurrentUser, get_current_user
from app.interfaces.schemas.student import (
    CreateStudentRequest,
    StudentResponse,
    StudentDetailResponse,
    StudentSensitiveDataResponse,
    TransferStudentRequest,
)

router = APIRouter(prefix="/api/alunos", tags=["alunos"])


# ── Mapeamento de Exceções de Domínio → HTTP ────────────────────────────────
# Centraliza a tradução: o Router sabe de HTTP, o Domínio sabe de negócio.

_DOMAIN_TO_HTTP: dict[type, int] = {
    ConsentimentoLGPDAusenteError: status.HTTP_422_UNPROCESSABLE_ENTITY,
    AlunoNaoEncontradoError: status.HTTP_404_NOT_FOUND,
    EscolaNaoEncontradaError: status.HTTP_404_NOT_FOUND,
    TenantMismatchError: status.HTTP_403_FORBIDDEN,
    AlunoJaArquivadoError: status.HTTP_409_CONFLICT,
    JustificativaInsuficienteError: status.HTTP_422_UNPROCESSABLE_ENTITY,
    PermissaoInsuficienteError: status.HTTP_403_FORBIDDEN,
}


def _domain_to_http(exc: DomainException) -> HTTPException:
    """Converte exceção de domínio em HTTPException com status adequado."""
    http_status = _DOMAIN_TO_HTTP.get(type(exc), status.HTTP_400_BAD_REQUEST)
    return HTTPException(status_code=http_status, detail=exc.message)




# ── Injeção de Dependências ───────────────────────────────────────────────


def get_create_student_use_case(
    session: AsyncSession = Depends(get_session),
) -> CreateStudentUseCase:
    return CreateStudentUseCase(
        session=session,
        student_repo=SQLModelStudentRepository(session),
        school_repo=SQLModelSchoolRepository(session),
    )


def get_archive_student_use_case(
    session: AsyncSession = Depends(get_session),
) -> ArchiveStudentUseCase:
    return ArchiveStudentUseCase(
        session=session,
        student_repo=SQLModelStudentRepository(session),
        audit_repo=SQLModelAuditLogRepository(session),
    )


def get_transfer_student_use_case(
    session: AsyncSession = Depends(get_session),
) -> TransferStudentUseCase:
    return TransferStudentUseCase(
        session=session,
        student_repo=SQLModelStudentRepository(session),
        school_repo=SQLModelSchoolRepository(session),
        assignment_repo=SQLModelProfessorAssignmentRepository(session),
        history_repo=SQLModelStudentHistoryRepository(session),
    )


# ── Endpoints ─────────────────────────────────────────────────────────────


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    request: CreateStudentRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: CreateStudentUseCase = Depends(get_create_student_use_case),
) -> StudentResponse:
    input_dto = CreateStudentInput(
        nome=request.nome,
        tenant_id=current_user.tenant_id,
        escola_atual_id=request.escola_atual_id,
        consentimento_lgpd=request.consentimento_lgpd,
        data_nascimento=request.data_nascimento,
        diagnostico=request.diagnostico,
        laudo=request.laudo,
        base_legal=request.base_legal,
    )
    try:
        student = await use_case.execute(input_dto)
        return student  # type: ignore[return-value]
    except DomainException as e:
        raise _domain_to_http(e) from e


@router.post("/{student_id}/arquivar", response_model=StudentResponse)
async def archive_student(
    student_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: ArchiveStudentUseCase = Depends(get_archive_student_use_case),
) -> StudentResponse:
    input_dto = ArchiveStudentInput(
        student_id=student_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
    )
    try:
        student = await use_case.execute(input_dto)
        return student  # type: ignore[return-value]
    except DomainException as e:
        raise _domain_to_http(e) from e


@router.post("/{student_id}/transferir", response_model=StudentResponse)
async def transfer_student(
    student_id: uuid.UUID,
    request: TransferStudentRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: TransferStudentUseCase = Depends(get_transfer_student_use_case),
) -> StudentResponse:
    input_dto = TransferStudentInput(
        student_id=student_id,
        nova_escola_id=request.nova_escola_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
    )
    try:
        student = await use_case.execute(input_dto)
        return student  # type: ignore[return-value]
    except DomainException as e:
        raise _domain_to_http(e) from e


from app.application.use_cases.students.assign_professor import (
    AssignProfessorInput,
    AssignProfessorUseCase,
)
from app.interfaces.schemas.student import (
    CreateProfessorAssignmentRequest,
    ProfessorAssignmentResponse,
    UpdateStudentRequest,
)
from datetime import datetime, timezone

def get_assign_professor_use_case(
    session: AsyncSession = Depends(get_session),
) -> AssignProfessorUseCase:
    return AssignProfessorUseCase(
        session=session,
        student_repo=SQLModelStudentRepository(session),
        assignment_repo=SQLModelProfessorAssignmentRepository(session),
    )

@router.post("/{student_id}/vinculos", response_model=ProfessorAssignmentResponse)
async def assign_professor(
    student_id: uuid.UUID,
    request: CreateProfessorAssignmentRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: AssignProfessorUseCase = Depends(get_assign_professor_use_case),
) -> ProfessorAssignmentResponse:
    input_dto = AssignProfessorInput(
        tenant_id=current_user.tenant_id,
        student_id=student_id,
        usuario_id=request.usuario_id,
        tipo_papel=request.tipo_papel,
    )
    try:
        assignment = await use_case.execute(input_dto)
        return assignment  # type: ignore[return-value]
    except DomainException as e:
        raise _domain_to_http(e) from e
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

@router.get("/", response_model=List[StudentResponse])
async def list_students(
    status_aluno: Optional[str] = None,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> List[StudentResponse]:
    """Lista todos os estudantes do tenant do usuário. Não retorna dados sensíveis."""
    repo = SQLModelStudentRepository(session)
    st_enum = None
    if status_aluno:
        try:
            st_enum = StatusAluno(status_aluno)
        except ValueError:
            raise HTTPException(status_code=400, detail="Status inválido")

    students = await repo.list_by_tenant(current_user.tenant_id, status=st_enum)
    return students  # type: ignore[return-value]


@router.get("/{student_id}", response_model=StudentDetailResponse)
async def get_student(
    student_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> StudentDetailResponse:
    """
    Retorna os dados detalhados de um aluno específico.
    RN-26 e RN-27 ativas: O schema StudentDetailResponse garante vazamento zero de dados sensíveis.
    """
    repo = SQLModelStudentRepository(session)
    student = await repo.get_by_id(student_id)
    if not student or student.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=404, detail="Estudante não encontrado")
    return student  # type: ignore[return-value]


def get_update_student_use_case(
    session: AsyncSession = Depends(get_session),
) -> UpdateStudentUseCase:
    return UpdateStudentUseCase(
        session=session,
        student_repo=SQLModelStudentRepository(session),
    )


@router.put("/{student_id}", response_model=StudentDetailResponse)
async def update_student(
    student_id: uuid.UUID,
    request: UpdateStudentRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: UpdateStudentUseCase = Depends(get_update_student_use_case),
) -> StudentDetailResponse:
    """Atualização básica (não-sensível) dos dados do aluno do tenant logado.

    A lógica de negócio (validação de tenant, verificação de estado)
    reside inteiramente no UpdateStudentUseCase — o Router apenas traduz HTTP.
    """
    try:
        input_dto = UpdateStudentInput(
            student_id=student_id,
            tenant_id=current_user.tenant_id,
            user_id=current_user.id,
            nome=request.nome,
            data_nascimento=request.data_nascimento,
        )
        return await use_case.execute(input_dto)  # type: ignore[return-value]
    except DomainException as e:
        raise _domain_to_http(e) from e


from app.domain.entities.audit_log import AuditLog


@router.get("/{student_id}/dados-sensiveis", response_model=StudentSensitiveDataResponse)
@limiter.limit("20/minute")
async def get_sensitive_data(
    request: Request,
    student_id: uuid.UUID,
    justificativa: str,
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> StudentSensitiveDataResponse:
    """Retorna dados sensíveis do aluno exigindo justificativa obrigatória (LGPD art. 37)."""
    # Valida justificativa via exceção de domínio
    if len(justificativa) < 10:
        raise _domain_to_http(JustificativaInsuficienteError(minimo=10))

    student_repo = SQLModelStudentRepository(session)
    audit_repo = SQLModelAuditLogRepository(session)

    student = await student_repo.get_by_id(student_id)
    if not student or student.tenant_id != current_user.tenant_id:
        raise _domain_to_http(AlunoNaoEncontradoError(student_id))

    # Registrar acesso no Audit Log (LGPD Requirement)
    log = AuditLog(
        student_id=student.id,
        user_id=current_user.id,
        field_accessed=f"diagnostico, laudo (Justificada: {justificativa})",
        accessed_at=datetime.now(timezone.utc).replace(tzinfo=None),
    )
    await audit_repo.save(log)

    return StudentSensitiveDataResponse(
        diagnostico=student.diagnostico,
        laudo=student.laudo,
    )  # type: ignore[return-value]
