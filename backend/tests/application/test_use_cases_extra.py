"""
Testes unitários para:
- CreateSchoolUseCase
- ListSchoolsUseCase
- AddCommentUseCase
- AssignProfessorUseCase
"""
import uuid
import pytest

from app.application.use_cases.schools.create_school import CreateSchoolInput, CreateSchoolUseCase
from app.application.use_cases.schools.list_schools import ListSchoolsUseCase
from app.application.use_cases.reports.add_comment import AddCommentInput, AddCommentUseCase
from app.application.use_cases.students.assign_professor import AssignProfessorInput, AssignProfessorUseCase
from app.domain.entities.school import School
from app.domain.entities.report import Report
from app.domain.entities.professor_assignment import ProfessorAssignment
from app.domain.entities.user import PapelUsuario
from app.domain.models import Student, StatusAluno
from unittest.mock import AsyncMock, MagicMock

class MockAsyncSession:
    def begin(self):
        return self
    async def __aenter__(self):
        return self
    async def __aexit__(self, t, v, tb):
        pass



# ──────────────────────────────────────────────
# Mocks
# ──────────────────────────────────────────────

class MockSchoolRepository:
    def __init__(self) -> None:
        self.schools: dict[uuid.UUID, School] = {}

    async def save(self, school: School) -> School:
        self.schools[school.id] = school
        return school

    async def list_by_tenant(self, tenant_id: uuid.UUID) -> list[School]:
        return [s for s in self.schools.values() if s.tenant_id == tenant_id]

    async def get_by_id(self, id: uuid.UUID) -> School | None:
        return self.schools.get(id)


class MockReportRepository:
    def __init__(self, report: Report | None = None) -> None:
        self._report = report

    async def get_by_id(self, id: uuid.UUID) -> Report | None:
        return self._report

    async def save(self, report: Report) -> Report:
        self._report = report
        return report


class MockStudentRepository:
    def __init__(self, student: Student | None = None) -> None:
        self._student = student

    async def get_by_id(self, id: uuid.UUID) -> Student | None:
        return self._student

    async def list_by_tenant(self, tenant_id: uuid.UUID, status: str | None = None) -> list[Student]:
        return [self._student] if self._student else []

    async def save(self, student: Student) -> Student:
        self._student = student
        return student


class MockAssignmentRepository:
    def __init__(self, assignments: list[ProfessorAssignment] | None = None) -> None:
        self._assignments: list[ProfessorAssignment] = assignments or []

    async def list_active_by_student(self, student_id: uuid.UUID) -> list[ProfessorAssignment]:
        return [a for a in self._assignments if a.aluno_id == student_id and a.ativo]

    async def save(self, assignment: ProfessorAssignment) -> ProfessorAssignment:
        self._assignments.append(assignment)
        return assignment


# ──────────────────────────────────────────────
# CreateSchoolUseCase
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_school_sucesso() -> None:
    repo = MockSchoolRepository()
    use_case = CreateSchoolUseCase(session=MockAsyncSession(), school_repo=repo)
    tenant_id = uuid.uuid4()
    inp = CreateSchoolInput(tenant_id=tenant_id, nome="Escola Nova")
    school = await use_case.execute(inp)
    assert school.nome == "Escola Nova"
    assert school.tenant_id == tenant_id
    assert school.id is not None


# ──────────────────────────────────────────────
# ListSchoolsUseCase
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_schools_vazio() -> None:
    repo = MockSchoolRepository()
    use_case = ListSchoolsUseCase(session=MockAsyncSession(), school_repo=repo)
    result = await use_case.execute(uuid.uuid4())
    assert result == []


@pytest.mark.asyncio
async def test_list_schools_filtra_por_tenant() -> None:
    repo = MockSchoolRepository()
    tenant_a = uuid.uuid4()
    tenant_b = uuid.uuid4()
    await repo.save(School(tenant_id=tenant_a, nome="Escola A"))
    await repo.save(School(tenant_id=tenant_b, nome="Escola B"))
    use_case = ListSchoolsUseCase(session=MockAsyncSession(), school_repo=repo)
    result = await use_case.execute(tenant_a)
    assert len(result) == 1
    assert result[0].nome == "Escola A"


# ──────────────────────────────────────────────
# AddCommentUseCase
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_add_comment_requer_coordenacao() -> None:
    repo = MockReportRepository()
    use_case = AddCommentUseCase(session=MockAsyncSession(), report_repo=repo)
    inp = AddCommentInput(
        report_id=uuid.uuid4(),
        autor_id=uuid.uuid4(),
        executor_papel=PapelUsuario.PROF_AEE,
        texto="Comentário proibido",
    )
    with pytest.raises(ValueError, match="coordenação"):
        await use_case.execute(inp)


@pytest.mark.asyncio
async def test_add_comment_report_nao_encontrado() -> None:
    repo = MockReportRepository(report=None)
    use_case = AddCommentUseCase(session=MockAsyncSession(), report_repo=repo)
    inp = AddCommentInput(
        report_id=uuid.uuid4(),
        autor_id=uuid.uuid4(),
        executor_papel=PapelUsuario.COORDENACAO,
        texto="Algo",
    )
    with pytest.raises(ValueError, match="não encontrado"):
        await use_case.execute(inp)


@pytest.mark.asyncio
async def test_add_comment_sucesso() -> None:
    aluno_id = uuid.uuid4()
    autor_id = uuid.uuid4()
    report = Report(aluno_id=aluno_id, autor_id=autor_id, conteudo_json=None)
    repo = MockReportRepository(report=report)
    use_case = AddCommentUseCase(session=MockAsyncSession(), report_repo=repo)
    inp = AddCommentInput(
        report_id=report.id,
        autor_id=autor_id,
        executor_papel=PapelUsuario.COORDENACAO,
        texto="Ótimo progresso!",
    )
    updated = await use_case.execute(inp)
    assert updated.conteudo_json is not None
    comentarios = updated.conteudo_json["comentarios"]
    assert len(comentarios) == 1
    assert comentarios[0]["texto"] == "Ótimo progresso!"


@pytest.mark.asyncio
async def test_add_comment_append_em_json_existente() -> None:
    aluno_id = uuid.uuid4()
    autor_id = uuid.uuid4()
    report = Report(
        aluno_id=aluno_id,
        autor_id=autor_id,
        conteudo_json={"comentarios": [{"texto": "primeiro", "autor_id": str(autor_id), "created_at": "2024-01-01"}]},
    )
    repo = MockReportRepository(report=report)
    use_case = AddCommentUseCase(session=MockAsyncSession(), report_repo=repo)
    inp = AddCommentInput(
        report_id=report.id,
        autor_id=autor_id,
        executor_papel=PapelUsuario.COORDENACAO,
        texto="segundo comentário",
    )
    updated = await use_case.execute(inp)
    assert len(updated.conteudo_json["comentarios"]) == 2


# ──────────────────────────────────────────────
# AssignProfessorUseCase
# ──────────────────────────────────────────────

def make_student(tenant_id: uuid.UUID, escola_id: uuid.UUID | None = None) -> Student:
    return Student(
        nome="Aluno Teste",
        tenant_id=tenant_id,
        escola_atual_id=escola_id,
        consentimento_lgpd=True,
        status=StatusAluno.ATIVO,
    )


@pytest.mark.asyncio
async def test_assign_aluno_nao_encontrado() -> None:
    student_repo = MockStudentRepository(student=None)
    assignment_repo = MockAssignmentRepository()
    use_case = AssignProfessorUseCase(
        session=MockAsyncSession(), student_repo=student_repo, assignment_repo=assignment_repo
    )
    inp = AssignProfessorInput(
        tenant_id=uuid.uuid4(),
        student_id=uuid.uuid4(),
        usuario_id=uuid.uuid4(),
        tipo_papel=PapelUsuario.PROF_AEE,
    )
    with pytest.raises(ValueError, match="não encontrado"):
        await use_case.execute(inp)


@pytest.mark.asyncio
async def test_assign_aluno_outro_tenant() -> None:
    tenant_id = uuid.uuid4()
    escola_id = uuid.uuid4()
    student = make_student(tenant_id=uuid.uuid4(), escola_id=escola_id)  # tenant diferente
    student_repo = MockStudentRepository(student=student)
    assignment_repo = MockAssignmentRepository()
    use_case = AssignProfessorUseCase(
        session=MockAsyncSession(), student_repo=student_repo, assignment_repo=assignment_repo
    )
    inp = AssignProfessorInput(
        tenant_id=tenant_id,
        student_id=student.id,
        usuario_id=uuid.uuid4(),
        tipo_papel=PapelUsuario.PROF_AEE,
    )
    with pytest.raises(ValueError, match="não encontrado"):
        await use_case.execute(inp)


@pytest.mark.asyncio
async def test_assign_aluno_sem_escola() -> None:
    tenant_id = uuid.uuid4()
    student = make_student(tenant_id=tenant_id, escola_id=None)
    student_repo = MockStudentRepository(student=student)
    assignment_repo = MockAssignmentRepository()
    use_case = AssignProfessorUseCase(
        session=MockAsyncSession(), student_repo=student_repo, assignment_repo=assignment_repo
    )
    inp = AssignProfessorInput(
        tenant_id=tenant_id,
        student_id=student.id,
        usuario_id=uuid.uuid4(),
        tipo_papel=PapelUsuario.PROF_AEE,
    )
    with pytest.raises(ValueError, match="nenhuma escola"):
        await use_case.execute(inp)


@pytest.mark.asyncio
async def test_assign_vinculo_duplicado() -> None:
    tenant_id = uuid.uuid4()
    escola_id = uuid.uuid4()
    usuario_id = uuid.uuid4()
    student = make_student(tenant_id=tenant_id, escola_id=escola_id)
    existing = ProfessorAssignment(
        usuario_id=usuario_id,
        escola_id=escola_id,
        aluno_id=student.id,
        tipo_papel=PapelUsuario.PROF_AEE,
        ativo=True,
    )
    student_repo = MockStudentRepository(student=student)
    assignment_repo = MockAssignmentRepository(assignments=[existing])
    use_case = AssignProfessorUseCase(
        session=MockAsyncSession(), student_repo=student_repo, assignment_repo=assignment_repo
    )
    inp = AssignProfessorInput(
        tenant_id=tenant_id,
        student_id=student.id,
        usuario_id=usuario_id,
        tipo_papel=PapelUsuario.PROF_AEE,
    )
    with pytest.raises(ValueError, match="vínculo ativo"):
        await use_case.execute(inp)


@pytest.mark.asyncio
async def test_assign_sucesso() -> None:
    tenant_id = uuid.uuid4()
    escola_id = uuid.uuid4()
    student = make_student(tenant_id=tenant_id, escola_id=escola_id)
    student_repo = MockStudentRepository(student=student)
    assignment_repo = MockAssignmentRepository()
    use_case = AssignProfessorUseCase(
        session=MockAsyncSession(), student_repo=student_repo, assignment_repo=assignment_repo
    )
    inp = AssignProfessorInput(
        tenant_id=tenant_id,
        student_id=student.id,
        usuario_id=uuid.uuid4(),
        tipo_papel=PapelUsuario.PROF_AEE,
    )
    result = await use_case.execute(inp)
    assert result.aluno_id == student.id
    assert result.tipo_papel == PapelUsuario.PROF_AEE
