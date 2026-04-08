import uuid
from datetime import datetime, timezone, timedelta

import pytest

from app.application.use_cases.reports.sync_report import (
    ConcurrencyError,
    SyncReportInput,
    SyncReportUseCase,
)
from app.domain.entities.report import Report, TipoRelatorio


def _naive_now() -> datetime:
    """datetime naive UTC, como o banco de dados armazena."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class MockReportRepository:
    def __init__(self) -> None:
        self.reports: dict[uuid.UUID, Report] = {}

    async def get_by_id(self, id: uuid.UUID) -> Report | None:
        return self.reports.get(id)

    async def save(self, report: Report) -> Report:
        self.reports[report.id] = report
        return report


@pytest.fixture
def repo_report() -> MockReportRepository:
    return MockReportRepository()


class MockStudentRepository:
    def __init__(self):
        self.students = {}
    async def get_by_id(self, id):
        from app.domain.models import Student
        return Student(id=id, tenant_id=uuid.UUID(int=0), nome="Teste", status="ativo", escola_atual_id=uuid.uuid4(), diagnostico=None, consentimento_lgpd=True, created_at=_naive_now(), updated_at=_naive_now())


@pytest.fixture
def repo_student() -> MockStudentRepository:
    return MockStudentRepository()


@pytest.mark.asyncio
async def test_sync_report_success(repo_report: MockReportRepository, repo_student: MockStudentRepository) -> None:
    now = _naive_now()
    report_id = uuid.uuid4()
    autor_id = uuid.uuid4()
    aluno_id = uuid.uuid4()
    
    report = Report(
        id=report_id,
        tipo=TipoRelatorio.AEE,
        aluno_id=aluno_id,
        autor_id=autor_id,
        conteudo_json={"secao_1": "v1"},
        updated_at=now,
    )
    repo_report.reports[report_id] = report

    use_case = SyncReportUseCase(report_repo=repo_report, student_repo=repo_student)
    input_dto = SyncReportInput(
        id=report_id,
        tipo=TipoRelatorio.AEE,
        aluno_id=aluno_id,
        autor_id=autor_id,
        tenant_id=uuid.UUID(int=0), # Mock student is UUID 0
        conteudo_json={"secao_1": "v2"},
        updated_at_local=now,  # Sem conflito
    )

    updated_reports = await use_case.execute([input_dto])
    updated_report = updated_reports[0]
    
    assert updated_report.conteudo_json == {"secao_1": "v2"}
    assert updated_report.conflict_flag is False


@pytest.mark.asyncio
async def test_sync_report_conflict(repo_report: MockReportRepository, repo_student: MockStudentRepository) -> None:
    now = _naive_now()
    report_id = uuid.uuid4()
    autor_id = uuid.uuid4()
    aluno_id = uuid.uuid4()
    
    # Simula que o DB foi atualizado por outro usuário 5 minutos depois
    db_updated_at = now + timedelta(minutes=5)
    
    report = Report(
        id=report_id,
        tipo=TipoRelatorio.AEE,
        aluno_id=aluno_id,
        autor_id=autor_id,
        conteudo_json={"secao_1": "db_version"},
        updated_at=db_updated_at,
    )
    repo_report.reports[report_id] = report

    use_case = SyncReportUseCase(report_repo=repo_report, student_repo=repo_student)
    
    # Cliente envia payload baseado em um timestamp antigo (now)
    input_dto = SyncReportInput(
        id=report_id,
        tipo=TipoRelatorio.AEE,
        aluno_id=aluno_id,
        autor_id=autor_id,
        tenant_id=uuid.UUID(int=0),
        conteudo_json={"secao_1": "client_version_offline"},
        updated_at_local=now,
    )

    with pytest.raises(ConcurrencyError, match="Conflito detectado na sincronização"):
        await use_case.execute([input_dto])
        
    assert repo_report.reports[report_id].conflict_flag is True
