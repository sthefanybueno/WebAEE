import uuid
import pytest

from app.application.use_cases.reports.add_comment import (
    AddCommentUseCase,
    AddCommentInput,
)
from app.domain.entities.report import Report, TipoRelatorio, SyncStatus
from app.domain.entities.user import PapelUsuario


class MockReportRepository:
    def __init__(self) -> None:
        self.reports: dict[uuid.UUID, Report] = {}

    async def get_by_id(self, id: uuid.UUID) -> Report | None:
        return self.reports.get(id)

    async def save(self, report: Report) -> Report:
        self.reports[report.id] = report
        return report


def _make_report(conteudo_json: dict | None = None) -> Report:
    return Report(
        tipo=TipoRelatorio.AEE,
        aluno_id=uuid.uuid4(),
        autor_id=uuid.uuid4(),
        conteudo_json=conteudo_json,
    )


@pytest.fixture
def repo() -> MockReportRepository:
    return MockReportRepository()


@pytest.mark.asyncio
async def test_only_coordenacao_can_add_comment(repo: MockReportRepository) -> None:
    uc = AddCommentUseCase(report_repo=repo)
    report = _make_report()
    repo.reports[report.id] = report

    for papel in (PapelUsuario.ADMIN, PapelUsuario.PROF_AEE, PapelUsuario.PROF_APOIO, PapelUsuario.PROF_REGENTE):
        with pytest.raises(ValueError, match="Apenas usuários com papel de coordenação"):
            await uc.execute(AddCommentInput(
                report_id=report.id,
                autor_id=uuid.uuid4(),
                executor_papel=papel,
                texto="Comentário teste",
            ))


@pytest.mark.asyncio
async def test_add_comment_report_not_found(repo: MockReportRepository) -> None:
    uc = AddCommentUseCase(report_repo=repo)
    with pytest.raises(ValueError, match="Relatório não encontrado"):
        await uc.execute(AddCommentInput(
            report_id=uuid.uuid4(),
            autor_id=uuid.uuid4(),
            executor_papel=PapelUsuario.COORDENACAO,
            texto="Qualquer texto",
        ))


@pytest.mark.asyncio
async def test_add_comment_success(repo: MockReportRepository) -> None:
    uc = AddCommentUseCase(report_repo=repo)
    report = _make_report()
    repo.reports[report.id] = report

    result = await uc.execute(AddCommentInput(
        report_id=report.id,
        autor_id=uuid.uuid4(),
        executor_papel=PapelUsuario.COORDENACAO,
        texto="Ótima evolução!",
    ))

    assert result.conteudo_json is not None
    comentarios = result.conteudo_json["comentarios"]
    assert len(comentarios) == 1
    assert comentarios[0]["texto"] == "Ótima evolução!"


@pytest.mark.asyncio
async def test_add_comment_appends_to_existing(repo: MockReportRepository) -> None:
    uc = AddCommentUseCase(report_repo=repo)
    report = _make_report(conteudo_json={"comentarios": [{"texto": "Primeiro", "autor_id": str(uuid.uuid4()), "created_at": "2024-01-01"}]})
    repo.reports[report.id] = report

    result = await uc.execute(AddCommentInput(
        report_id=report.id,
        autor_id=uuid.uuid4(),
        executor_papel=PapelUsuario.COORDENACAO,
        texto="Segundo comentário",
    ))

    assert len(result.conteudo_json["comentarios"]) == 2
    assert result.conteudo_json["comentarios"][1]["texto"] == "Segundo comentário"


@pytest.mark.asyncio
async def test_add_comment_creates_conteudo_json_when_none(repo: MockReportRepository) -> None:
    uc = AddCommentUseCase(report_repo=repo)
    report = _make_report(conteudo_json=None)
    repo.reports[report.id] = report

    result = await uc.execute(AddCommentInput(
        report_id=report.id,
        autor_id=uuid.uuid4(),
        executor_papel=PapelUsuario.COORDENACAO,
        texto="Primeiro!",
    ))

    assert "comentarios" in result.conteudo_json
    assert result.conteudo_json["comentarios"][0]["texto"] == "Primeiro!"
