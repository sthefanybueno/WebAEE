import uuid
from datetime import datetime, timezone, timedelta

import pytest

from app.application.use_cases.reports.sync_report import (
    ConcurrencyError,
    SyncReportInput,
    SyncReportUseCase,
)
from app.domain.entities.report import Report, TipoRelatorio


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


@pytest.mark.asyncio
async def test_sync_report_success(repo_report: MockReportRepository) -> None:
    now = datetime.now(timezone.utc)
    report_id = uuid.uuid4()
    autor_id = uuid.uuid4()
    
    report = Report(
        id=report_id,
        tipo=TipoRelatorio.AEE,
        aluno_id=uuid.uuid4(),
        autor_id=autor_id,
        conteudo_json={"secao_1": "v1"},
        updated_at=now,
    )
    repo_report.reports[report_id] = report

    use_case = SyncReportUseCase(report_repo=repo_report)
    input_dto = SyncReportInput(
        report_id=report_id,
        user_id=autor_id,
        conteudo_json={"secao_1": "v2"},
        client_updated_at=now,  # Sem conflito
    )

    updated_report = await use_case.execute(input_dto)
    
    assert updated_report.conteudo_json == {"secao_1": "v2"}
    assert updated_report.conflict_flag is False


@pytest.mark.asyncio
async def test_sync_report_conflict(repo_report: MockReportRepository) -> None:
    now = datetime.now(timezone.utc)
    report_id = uuid.uuid4()
    autor_id = uuid.uuid4()
    
    # Simula que o DB foi atualizado por outro usuário 5 minutos depois
    db_updated_at = now + timedelta(minutes=5)
    
    report = Report(
        id=report_id,
        tipo=TipoRelatorio.AEE,
        aluno_id=uuid.uuid4(),
        autor_id=autor_id,
        conteudo_json={"secao_1": "db_version"},
        updated_at=db_updated_at,
    )
    repo_report.reports[report_id] = report

    use_case = SyncReportUseCase(report_repo=repo_report)
    
    # Cliente envia payload baseado em um timestamp antigo (now)
    input_dto = SyncReportInput(
        report_id=report_id,
        user_id=autor_id,
        conteudo_json={"secao_1": "client_version_offline"},
        client_updated_at=now,
    )

    with pytest.raises(ConcurrencyError, match="Conflito detectado na sincronização"):
        await use_case.execute(input_dto)
        
    assert repo_report.reports[report_id].conflict_flag is True
