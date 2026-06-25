"""
Sistema AEE — Router: Alunos
==============================
Responsabilidade única: traduzir HTTP → DTO → Use Case → Resposta HTTP.

[Clean Architecture v3]
- NENHUM repositório concreto é instanciado neste arquivo.
- NENHUMA lógica de negócio reside neste arquivo.
- TODAS as factories de DI delegam para a infraestrutura via SQLAlchemyUnitOfWork.
- A tradução de DomainException → HTTPException está centralizada em _domain_to_http().
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel.ext.asyncio.session import AsyncSession

from app.infrastructure.rate_limit import limiter
from app.infrastructure.database import get_session
from app.infrastructure.unit_of_work_impl import SQLAlchemyUnitOfWork
from app.infrastructure.repositories.audit_log_repository_impl import SQLModelAuditLogRepository
from app.infrastructure.repositories.professor_assignment_repository_impl import SQLModelProfessorAssignmentRepository
from app.infrastructure.repositories.school_repository_impl import SQLModelSchoolRepository
from app.infrastructure.repositories.student_history_repository_impl import SQLModelStudentHistoryRepository
from app.infrastructure.repositories.student_repository_impl import SQLModelStudentRepository

from app.domain.models import StatusAluno
from app.domain.exceptions import (
    AlunoJaArquivadoError,
    AlunoNaoEncontradoError,
    ConsentimentoLGPDAusenteError,
    DomainException,
    EscolaNaoEncontradaError,
    JustificativaInsuficienteError,
    PermissaoInsuficienteError,
    TenantMismatchError,
)

from app.application.use_cases.students.archive_student import ArchiveStudentInput, ArchiveStudentUseCase
from app.application.use_cases.students.assign_professor import AssignProfessorInput, AssignProfessorUseCase
from app.application.use_cases.students.create_student import CreateStudentInput, CreateStudentUseCase
from app.application.use_cases.students.get_sensitive_data import GetSensitiveDataInput, GetSensitiveDataUseCase
from app.application.use_cases.students.get_student import GetStudentInput, GetStudentUseCase
from app.application.use_cases.students.list_students import ListStudentsInput, ListStudentsUseCase
from app.application.use_cases.students.transfer_student import TransferStudentInput, TransferStudentUseCase
from app.application.use_cases.students.update_student import UpdateStudentInput, UpdateStudentUseCase

from app.interfaces.dependencies import CurrentUser, get_current_user
from app.interfaces.schemas.student import (
    CreateProfessorAssignmentRequest,
    CreateStudentRequest,
    ProfessorAssignmentResponse,
    StudentDetailResponse,
    StudentResponse,
    StudentSensitiveDataResponse,
    TransferStudentRequest,
    UpdateStudentRequest,
)

router = APIRouter(prefix="/api/alunos", tags=["alunos"])


# ── Mapeamento de Exceções de Domínio → HTTP ────────────────────────────────
# O Router sabe de HTTP; o Domínio sabe de negócio. Tradução centralizada aqui.

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


# ── Factories de Injeção de Dependências ─────────────────────────────────────
# Padrão: cada factory cria o Use Case injetando UoW + repos concretos.
# Os Use Cases não conhecem SQLAlchemy; apenas as factories (infra) conhecem.


def get_create_student_use_case(
    session: AsyncSession = Depends(get_session),
) -> CreateStudentUseCase:
    uow = SQLAlchemyUnitOfWork(session)
    return CreateStudentUseCase(
        uow=uow,
        student_repo=SQLModelStudentRepository(session),
        school_repo=SQLModelSchoolRepository(session),
    )


from app.application.use_cases.students.activate_student import ActivateStudentInput, ActivateStudentUseCase

def get_archive_student_use_case(
    session: AsyncSession = Depends(get_session),
) -> ArchiveStudentUseCase:
    uow = SQLAlchemyUnitOfWork(session)
    return ArchiveStudentUseCase(
        uow=uow,
        student_repo=SQLModelStudentRepository(session),
        audit_repo=SQLModelAuditLogRepository(session),
    )

def get_activate_student_use_case(
    session: AsyncSession = Depends(get_session),
) -> ActivateStudentUseCase:
    uow = SQLAlchemyUnitOfWork(session)
    return ActivateStudentUseCase(
        uow=uow,
        student_repo=SQLModelStudentRepository(session),
        audit_repo=SQLModelAuditLogRepository(session),
    )


def get_transfer_student_use_case(
    session: AsyncSession = Depends(get_session),
) -> TransferStudentUseCase:
    uow = SQLAlchemyUnitOfWork(session)
    return TransferStudentUseCase(
        uow=uow,
        student_repo=SQLModelStudentRepository(session),
        school_repo=SQLModelSchoolRepository(session),
        assignment_repo=SQLModelProfessorAssignmentRepository(session),
        history_repo=SQLModelStudentHistoryRepository(session),
    )


def get_assign_professor_use_case(
    session: AsyncSession = Depends(get_session),
) -> AssignProfessorUseCase:
    uow = SQLAlchemyUnitOfWork(session)
    return AssignProfessorUseCase(
        uow=uow,
        student_repo=SQLModelStudentRepository(session),
        assignment_repo=SQLModelProfessorAssignmentRepository(session),
    )


def get_update_student_use_case(
    session: AsyncSession = Depends(get_session),
) -> UpdateStudentUseCase:
    uow = SQLAlchemyUnitOfWork(session)
    return UpdateStudentUseCase(
        uow=uow,
        student_repo=SQLModelStudentRepository(session),
    )


def get_list_students_use_case(
    session: AsyncSession = Depends(get_session),
) -> ListStudentsUseCase:
    return ListStudentsUseCase(
        student_repo=SQLModelStudentRepository(session),
    )


def get_get_student_use_case(
    session: AsyncSession = Depends(get_session),
) -> GetStudentUseCase:
    return GetStudentUseCase(
        student_repo=SQLModelStudentRepository(session),
    )


def get_sensitive_data_use_case(
    session: AsyncSession = Depends(get_session),
) -> GetSensitiveDataUseCase:
    uow = SQLAlchemyUnitOfWork(session)
    return GetSensitiveDataUseCase(
        uow=uow,
        student_repo=SQLModelStudentRepository(session),
        audit_repo=SQLModelAuditLogRepository(session),
    )


from app.application.use_cases.students.delete_student import DeleteStudentInput, DeleteStudentUseCase

def get_delete_student_use_case(
    session: AsyncSession = Depends(get_session),
) -> DeleteStudentUseCase:
    uow = SQLAlchemyUnitOfWork(session)
    return DeleteStudentUseCase(
        uow=uow,
        student_repo=SQLModelStudentRepository(session),
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────
# Cada endpoint: (1) monta DTO, (2) delega ao Use Case, (3) traduz exceção.
# Sem lógica de negócio, sem repositórios, sem persistência direta.

@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: DeleteStudentUseCase = Depends(get_delete_student_use_case),
):
    try:
        await use_case.execute(DeleteStudentInput(
            student_id=student_id,
            tenant_id=current_user.tenant_id,
            papel=current_user.papel,
            user_id=current_user.id,
        ))
    except DomainException as e:
        raise _domain_to_http(e) from e


@router.post("/{student_id}/arquivar", response_model=StudentResponse)
async def archive_student(
    student_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: ArchiveStudentUseCase = Depends(get_archive_student_use_case),
) -> StudentResponse:
    try:
        student = await use_case.execute(ArchiveStudentInput(
            student_id=student_id,
            tenant_id=current_user.tenant_id,
            papel=current_user.papel,
            user_id=current_user.id,
        ))
        return student  # type: ignore[return-value]
    except DomainException as e:
        raise _domain_to_http(e) from e


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    request: CreateStudentRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: CreateStudentUseCase = Depends(get_create_student_use_case),
) -> StudentResponse:
    try:
        student = await use_case.execute(CreateStudentInput(
            nome=request.nome,
            tenant_id=current_user.tenant_id,
            escola_atual_id=request.escola_atual_id,
            consentimento_lgpd=request.consentimento_lgpd,
            data_nascimento=request.data_nascimento,
            diagnostico=request.diagnostico,
            laudo=request.laudo,
            base_legal=request.base_legal,
            apoio_id=request.apoio_id,
        ))
        return student  # type: ignore[return-value]
    except DomainException as e:
        raise _domain_to_http(e) from e


@router.post("/{student_id}/ativar", response_model=StudentResponse)
async def activate_student(
    student_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: ActivateStudentUseCase = Depends(get_activate_student_use_case),
) -> StudentResponse:
    try:
        student = await use_case.execute(ActivateStudentInput(
            student_id=student_id,
            tenant_id=current_user.tenant_id,
            papel=current_user.papel,
            user_id=current_user.id,
        ))
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
    try:
        student = await use_case.execute(TransferStudentInput(
            student_id=student_id,
            nova_escola_id=request.nova_escola_id,
            tenant_id=current_user.tenant_id,
            papel=current_user.papel,
            user_id=current_user.id,
        ))
        return student  # type: ignore[return-value]
    except DomainException as e:
        raise _domain_to_http(e) from e


@router.post("/{student_id}/vinculos", response_model=ProfessorAssignmentResponse)
async def assign_professor(
    student_id: uuid.UUID,
    request: CreateProfessorAssignmentRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: AssignProfessorUseCase = Depends(get_assign_professor_use_case),
) -> ProfessorAssignmentResponse:
    try:
        assignment = await use_case.execute(AssignProfessorInput(
            tenant_id=current_user.tenant_id,
            student_id=student_id,
            usuario_id=request.usuario_id,
            tipo_papel=request.tipo_papel,
            executor_papel=current_user.papel,
            executor_user_id=current_user.id,
        ))
        return assignment  # type: ignore[return-value]
    except DomainException as e:
        raise _domain_to_http(e) from e
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e


@router.get("/", response_model=List[StudentResponse])
async def list_students(
    status_aluno: Optional[str] = None,
    escola_id: Optional[uuid.UUID] = None,
    professor_id: Optional[uuid.UUID] = None,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: ListStudentsUseCase = Depends(get_list_students_use_case),
) -> List[StudentResponse]:
    """Lista todos os estudantes do tenant do usuário. Não retorna dados sensíveis."""
    st_enum: Optional[StatusAluno] = None
    if status_aluno:
        try:
            st_enum = StatusAluno(status_aluno)
        except ValueError:
            raise HTTPException(status_code=400, detail="Status inválido")

    students = await use_case.execute(ListStudentsInput(
        tenant_id=current_user.tenant_id,
        papel=current_user.papel,
        user_id=current_user.id,
        status=st_enum,
        escola_id=escola_id,
        professor_id=professor_id,
    ))
    return students  # type: ignore[return-value]


@router.get("/{student_id}", response_model=StudentDetailResponse)
async def get_student(
    student_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: GetStudentUseCase = Depends(get_get_student_use_case),
) -> StudentDetailResponse:
    """
    Retorna os dados detalhados de um aluno específico.
    RN-26 e RN-27 ativas: StudentDetailResponse garante vazamento zero de dados sensíveis.
    """
    try:
        student = await use_case.execute(GetStudentInput(
            student_id=student_id,
            tenant_id=current_user.tenant_id,
            papel=current_user.papel,
            user_id=current_user.id,
        ))
        return student  # type: ignore[return-value]
    except DomainException as e:
        raise _domain_to_http(e) from e


@router.put("/{student_id}", response_model=StudentDetailResponse)
async def update_student(
    student_id: uuid.UUID,
    request: UpdateStudentRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: UpdateStudentUseCase = Depends(get_update_student_use_case),
) -> StudentDetailResponse:
    """Atualização básica (não-sensível) dos dados do aluno do tenant logado."""
    try:
        return await use_case.execute(UpdateStudentInput(  # type: ignore[return-value]
            student_id=student_id,
            tenant_id=current_user.tenant_id,
            papel=current_user.papel,
            user_id=current_user.id,
            nome=request.nome,
            data_nascimento=request.data_nascimento,
            escola_atual_id=request.escola_atual_id,
            diagnostico=request.diagnostico,
            apoio_id=request.apoio_id,
        ))
    except DomainException as e:
        raise _domain_to_http(e) from e


@router.get("/{student_id}/dados-sensiveis", response_model=StudentSensitiveDataResponse)
@limiter.limit("20/minute")
async def get_sensitive_data(
    request: Request,
    student_id: uuid.UUID,
    justificativa: str,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: GetSensitiveDataUseCase = Depends(get_sensitive_data_use_case),
) -> StudentSensitiveDataResponse:
    """Retorna dados sensíveis do aluno exigindo justificativa obrigatória (LGPD art. 37)."""
    try:
        student = await use_case.execute(GetSensitiveDataInput(
            student_id=student_id,
            tenant_id=current_user.tenant_id,
            papel=current_user.papel,
            user_id=current_user.id,
            justificativa=justificativa,
        ))
        return StudentSensitiveDataResponse(
            diagnostico=student.diagnostico,
            laudo=student.laudo,
        )  # type: ignore[return-value]
    except DomainException as e:
        raise _domain_to_http(e) from e
