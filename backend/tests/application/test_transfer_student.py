import uuid
from datetime import datetime, timezone

import pytest

from app.application.use_cases.students.transfer_student import (
    TransferStudentInput,
    TransferStudentUseCase,
)
from app.domain.entities.professor_assignment import ProfessorAssignment
from app.domain.entities.school import School
from app.domain.entities.student_history import StudentSchoolHistory
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


class MockSchoolRepository:
    def __init__(self) -> None:
        self.schools: dict[uuid.UUID, School] = {}

    async def get_by_id(self, id: uuid.UUID) -> School | None:
        return self.schools.get(id)


class MockProfessorAssignmentRepository:
    def __init__(self) -> None:
        self.assignments: dict[uuid.UUID, ProfessorAssignment] = {}

    async def list_active_by_student(
        self, student_id: uuid.UUID
    ) -> list[ProfessorAssignment]:
        return [
            a
            for a in self.assignments.values()
            if a.aluno_id == student_id and a.ativo
        ]

    async def save(self, assignment: ProfessorAssignment) -> ProfessorAssignment:
        self.assignments[assignment.id] = assignment
        return assignment


class MockStudentHistoryRepository:
    def __init__(self) -> None:
        self.history: list[StudentSchoolHistory] = []

    async def save(self, history: StudentSchoolHistory) -> StudentSchoolHistory:
        self.history.append(history)
        return history


@pytest.fixture
def repo_student() -> MockStudentRepository:
    return MockStudentRepository()


@pytest.fixture
def repo_school() -> MockSchoolRepository:
    return MockSchoolRepository()


@pytest.fixture
def repo_assignment() -> MockProfessorAssignmentRepository:
    return MockProfessorAssignmentRepository()


@pytest.fixture
def repo_history() -> MockStudentHistoryRepository:
    return MockStudentHistoryRepository()


@pytest.mark.asyncio
async def test_transfer_student_success(
    repo_student: MockStudentRepository,
    repo_school: MockSchoolRepository,
    repo_assignment: MockProfessorAssignmentRepository,
    repo_history: MockStudentHistoryRepository,
) -> None:
    tenant_id = uuid.uuid4()
    student_id = uuid.uuid4()
    escola_antiga_id = uuid.uuid4()
    nova_escola_id = uuid.uuid4()
    user_id = uuid.uuid4()

    repo_student.students[student_id] = Student(
        id=student_id,
        nome="Joãozinho",
        tenant_id=tenant_id,
        escola_atual_id=escola_antiga_id,
        consentimento_lgpd=True,
    )

    repo_school.schools[nova_escola_id] = School(
        id=nova_escola_id, tenant_id=tenant_id, nome="Nova Escola"
    )

    assign_id = uuid.uuid4()
    repo_assignment.assignments[assign_id] = ProfessorAssignment(
        id=assign_id,
        usuario_id=uuid.uuid4(),
        escola_id=escola_antiga_id,
        aluno_id=student_id,
        tipo_papel=PapelUsuario.PROF_AEE,
    )

    use_case = TransferStudentUseCase(
        student_repo=repo_student,
        school_repo=repo_school,
        assignment_repo=repo_assignment,
        history_repo=repo_history,
    )

    input_dto = TransferStudentInput(
        student_id=student_id,
        nova_escola_id=nova_escola_id,
        tenant_id=tenant_id,
        user_id=user_id,
    )

    updated_student = await use_case.execute(input_dto)

    assert updated_student.escola_atual_id == nova_escola_id
    assert repo_assignment.assignments[assign_id].ativo is False
    assert repo_assignment.assignments[assign_id].data_fim is not None

    assert len(repo_history.history) == 1
    assert repo_history.history[0].student_id == student_id
    assert repo_history.history[0].school_id == nova_escola_id
    assert repo_history.history[0].user_id == user_id


@pytest.mark.asyncio
async def test_transfer_student_to_invalid_school(
    repo_student: MockStudentRepository,
    repo_school: MockSchoolRepository,
    repo_assignment: MockProfessorAssignmentRepository,
    repo_history: MockStudentHistoryRepository,
) -> None:
    tenant_id = uuid.uuid4()
    student_id = uuid.uuid4()
    repo_student.students[student_id] = Student(
        id=student_id,
        nome="Joãozinho",
        tenant_id=tenant_id,
        escola_atual_id=uuid.uuid4(),
        consentimento_lgpd=True,
    )

    use_case = TransferStudentUseCase(
        student_repo=repo_student,
        school_repo=repo_school,
        assignment_repo=repo_assignment,
        history_repo=repo_history,
    )

    input_dto = TransferStudentInput(
        student_id=student_id,
        nova_escola_id=uuid.uuid4(),
        tenant_id=tenant_id,
        user_id=uuid.uuid4(),
    )

    with pytest.raises(
        ValueError, match="Nova escola não encontrada ou pertence a outro tenant."
    ):
        await use_case.execute(input_dto)
