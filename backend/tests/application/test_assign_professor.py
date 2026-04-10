import uuid
import pytest

from app.application.use_cases.students.assign_professor import (
    AssignProfessorUseCase,
    AssignProfessorInput,
)
from app.domain.entities.professor_assignment import ProfessorAssignment
from app.domain.entities.user import PapelUsuario
from app.domain.models import Student


class MockStudentRepository:
    def __init__(self) -> None:
        self.students: dict[uuid.UUID, Student] = {}

    async def get_by_id(self, id: uuid.UUID) -> Student | None:
        return self.students.get(id)

    async def save(self, student: Student) -> Student:
        self.students[student.id] = student
        return student

    async def list_by_tenant(self, tenant_id: uuid.UUID, status: str | None = None) -> list[Student]:
        return [s for s in self.students.values() if s.tenant_id == tenant_id]


class MockAssignmentRepository:
    def __init__(self) -> None:
        self.assignments: list[ProfessorAssignment] = []

    async def list_by_student(self, student_id: uuid.UUID) -> list[ProfessorAssignment]:
        return [a for a in self.assignments if a.aluno_id == student_id]

    async def save(self, assignment: ProfessorAssignment) -> ProfessorAssignment:
        self.assignments.append(assignment)
        return assignment


def _make_student(tenant_id: uuid.UUID, escola_id: uuid.UUID | None = None) -> Student:
    from datetime import datetime, timezone
    return Student(
        tenant_id=tenant_id,
        nome="Aluno Teste",
        escola_atual_id=escola_id or uuid.uuid4(),
        consentimento_lgpd=True,
        data_consentimento=datetime.now(timezone.utc).replace(tzinfo=None),
    )


@pytest.fixture
def student_repo() -> MockStudentRepository:
    return MockStudentRepository()


@pytest.fixture
def assignment_repo() -> MockAssignmentRepository:
    return MockAssignmentRepository()


@pytest.mark.asyncio
async def test_assign_professor_student_not_found(
    student_repo: MockStudentRepository, assignment_repo: MockAssignmentRepository
) -> None:
    uc = AssignProfessorUseCase(student_repo=student_repo, assignment_repo=assignment_repo)
    with pytest.raises(ValueError, match="Aluno não encontrado no seu tenant"):
        await uc.execute(AssignProfessorInput(
            tenant_id=uuid.uuid4(),
            student_id=uuid.uuid4(),
            usuario_id=uuid.uuid4(),
            tipo_papel=PapelUsuario.PROF_AEE,
        ))


@pytest.mark.asyncio
async def test_assign_professor_wrong_tenant(
    student_repo: MockStudentRepository, assignment_repo: MockAssignmentRepository
) -> None:
    uc = AssignProfessorUseCase(student_repo=student_repo, assignment_repo=assignment_repo)
    tenant_a = uuid.uuid4()
    student = _make_student(tenant_a)
    student_repo.students[student.id] = student

    with pytest.raises(ValueError, match="Aluno não encontrado no seu tenant"):
        await uc.execute(AssignProfessorInput(
            tenant_id=uuid.uuid4(),  # tenant diferente
            student_id=student.id,
            usuario_id=uuid.uuid4(),
            tipo_papel=PapelUsuario.PROF_AEE,
        ))


@pytest.mark.asyncio
async def test_assign_professor_student_without_school(
    student_repo: MockStudentRepository, assignment_repo: MockAssignmentRepository
) -> None:
    uc = AssignProfessorUseCase(student_repo=student_repo, assignment_repo=assignment_repo)
    tenant_id = uuid.uuid4()
    student = _make_student(tenant_id)
    student.escola_atual_id = None  # sem escola
    student_repo.students[student.id] = student

    with pytest.raises(ValueError, match="Aluno não está vinculado a nenhuma escola"):
        await uc.execute(AssignProfessorInput(
            tenant_id=tenant_id,
            student_id=student.id,
            usuario_id=uuid.uuid4(),
            tipo_papel=PapelUsuario.PROF_AEE,
        ))


@pytest.mark.asyncio
async def test_assign_professor_success(
    student_repo: MockStudentRepository, assignment_repo: MockAssignmentRepository
) -> None:
    uc = AssignProfessorUseCase(student_repo=student_repo, assignment_repo=assignment_repo)
    tenant_id = uuid.uuid4()
    escola_id = uuid.uuid4()
    usuario_id = uuid.uuid4()
    student = _make_student(tenant_id, escola_id)
    student_repo.students[student.id] = student

    result = await uc.execute(AssignProfessorInput(
        tenant_id=tenant_id,
        student_id=student.id,
        usuario_id=usuario_id,
        tipo_papel=PapelUsuario.PROF_AEE,
    ))

    assert result.aluno_id == student.id
    assert result.usuario_id == usuario_id
    assert result.escola_id == escola_id
    assert result.tipo_papel == PapelUsuario.PROF_AEE
    assert result.ativo is True


@pytest.mark.asyncio
async def test_assign_professor_duplicate_raises_error(
    student_repo: MockStudentRepository, assignment_repo: MockAssignmentRepository
) -> None:
    uc = AssignProfessorUseCase(student_repo=student_repo, assignment_repo=assignment_repo)
    tenant_id = uuid.uuid4()
    escola_id = uuid.uuid4()
    usuario_id = uuid.uuid4()
    student = _make_student(tenant_id, escola_id)
    student_repo.students[student.id] = student

    inp = AssignProfessorInput(
        tenant_id=tenant_id,
        student_id=student.id,
        usuario_id=usuario_id,
        tipo_papel=PapelUsuario.PROF_AEE,
    )

    await uc.execute(inp)  # primeiro vínculo

    with pytest.raises(ValueError, match="já possui um vínculo ativo"):
        await uc.execute(inp)  # duplicado
