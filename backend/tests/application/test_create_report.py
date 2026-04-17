import uuid

import pytest

from app.application.use_cases.reports.create_report import (
    CreateReportInput,
    CreateReportUseCase,
)
from app.domain.entities.report import Report, ReportTemplate, TipoRelatorio
from app.domain.entities.user import PapelUsuario
from app.domain.models import Student

class MockAsyncSession:
    def begin(self): return self
    async def __aenter__(self): return self
    async def __aexit__(self, t, v, tb): pass



class MockReportRepository:
    def __init__(self) -> None:
        self.reports: dict[uuid.UUID, Report] = {}

    async def save(self, report: Report) -> Report:
        self.reports[report.id] = report
        return report


class MockReportTemplateRepository:
    def __init__(self) -> None:
        self.templates: dict[TipoRelatorio, ReportTemplate] = {}

    async def get_active_by_tipo(self, tipo: TipoRelatorio) -> ReportTemplate | None:
        return self.templates.get(tipo)


class MockStudentRepository:
    def __init__(self) -> None:
        self.students: dict[uuid.UUID, Student] = {}

    async def get_by_id(self, id: uuid.UUID) -> Student | None:
        return self.students.get(id)


@pytest.fixture
def repo_report() -> MockReportRepository:
    return MockReportRepository()


@pytest.fixture
def repo_template() -> MockReportTemplateRepository:
    return MockReportTemplateRepository()


@pytest.fixture
def repo_student() -> MockStudentRepository:
    return MockStudentRepository()


@pytest.mark.asyncio
async def test_create_report_success(
    repo_report: MockReportRepository,
    repo_template: MockReportTemplateRepository,
    repo_student: MockStudentRepository,
) -> None:
    student_id = uuid.uuid4()
    tenant_id = uuid.uuid4()
    autor_id = uuid.uuid4()

    repo_student.students[student_id] = Student(
        id=student_id, nome="Maria", tenant_id=tenant_id, consentimento_lgpd=True
    )

    template = ReportTemplate(
        id=uuid.uuid4(), tipo=TipoRelatorio.AEE, secoes=[{"nome": "secao_1", "campos": ["campo_1"]}]
    )
    repo_template.templates[TipoRelatorio.AEE] = template

    use_case = CreateReportUseCase(
        session=MockAsyncSession(),
        report_repo=repo_report, template_repo=repo_template, student_repo=repo_student
    )
    input_dto = CreateReportInput(
        tipo=TipoRelatorio.AEE,
        aluno_id=student_id,
        autor_id=autor_id,
        tenant_id=tenant_id,
        papel_autor=PapelUsuario.PROF_AEE,
        conteudo_json={"secao_1": "valor"},
    )

    report = await use_case.execute(input_dto)
    assert report.tipo == TipoRelatorio.AEE
    # Usa mode="json" para comparar UUIDs como strings
    assert report.template_snapshot == template.model_dump(mode="json")
    assert report.conteudo_json == {"secao_1": "valor"}


@pytest.mark.asyncio
async def test_create_report_invalid_role(
    repo_report: MockReportRepository,
    repo_template: MockReportTemplateRepository,
    repo_student: MockStudentRepository,
) -> None:
    student_id = uuid.uuid4()
    tenant_id = uuid.uuid4()
    autor_id = uuid.uuid4()

    repo_student.students[student_id] = Student(
        id=student_id, nome="Maria", tenant_id=tenant_id, consentimento_lgpd=True
    )

    repo_template.templates[TipoRelatorio.AEE] = ReportTemplate(
        id=uuid.uuid4(), tipo=TipoRelatorio.AEE
    )

    use_case = CreateReportUseCase(
        session=MockAsyncSession(),
        report_repo=repo_report, template_repo=repo_template, student_repo=repo_student
    )
    input_dto = CreateReportInput(
        tipo=TipoRelatorio.AEE,
        aluno_id=student_id,
        autor_id=autor_id,
        tenant_id=tenant_id,
        papel_autor=PapelUsuario.PROF_REGENTE,  # Papel inválido para relatório AEE
        conteudo_json={},
    )

    with pytest.raises(ValueError, match="Papel de usuário não permitido para este tipo de relatório."):
        await use_case.execute(input_dto)
