import uuid
import pytest
from datetime import datetime, timezone

from app.application.use_cases.students.create_student import (
    CreateStudentUseCase,
    CreateStudentInput,
)
from app.domain.models import Student
from app.domain.entities.school import School

class MockStudentRepository:
    def __init__(self) -> None:
        self.saved_students: dict[uuid.UUID, Student] = {}

    async def get_by_id(self, id: uuid.UUID) -> Student | None:
        return self.saved_students.get(id)

    async def list_by_tenant(self, tenant_id: uuid.UUID, status: str | None = None) -> list[Student]:
        return list(self.saved_students.values())

    async def save(self, student: Student) -> Student:
        self.saved_students[student.id] = student
        return student


class MockSchoolRepository:
    def __init__(self) -> None:
        self.schools: dict[uuid.UUID, School] = {}

    async def get_by_id(self, id: uuid.UUID) -> School | None:
        return self.schools.get(id)


@pytest.fixture
def repo_student() -> MockStudentRepository:
    return MockStudentRepository()


@pytest.fixture
def repo_school() -> MockSchoolRepository:
    return MockSchoolRepository()


@pytest.mark.asyncio
async def test_create_student_requires_lgpd_consent(
    repo_student: MockStudentRepository, repo_school: MockSchoolRepository
) -> None:
    use_case = CreateStudentUseCase(student_repo=repo_student, school_repo=repo_school)
    
    tenant_id = uuid.uuid4()
    escola_id = uuid.uuid4()
    
    input_dto = CreateStudentInput(
        nome="João da Silva",
        tenant_id=tenant_id,
        escola_atual_id=escola_id,
        consentimento_lgpd=False,
    )

    with pytest.raises(ValueError, match="consentimento_lgpd DEVE ser True"):
        await use_case.execute(input_dto)


@pytest.mark.asyncio
async def test_create_student_school_not_found_or_invalid_tenant(
    repo_student: MockStudentRepository, repo_school: MockSchoolRepository
) -> None:
    use_case = CreateStudentUseCase(student_repo=repo_student, school_repo=repo_school)
    
    tenant_id = uuid.uuid4()
    escola_id = uuid.uuid4()
    
    # Escola não está no repositório mock
    input_dto = CreateStudentInput(
        nome="João",
        tenant_id=tenant_id,
        escola_atual_id=escola_id,
        consentimento_lgpd=True,
    )

    with pytest.raises(ValueError, match="Escola não encontrada ou pertence a outro tenant"):
        await use_case.execute(input_dto)

    # Escola existe mas em outro tenant
    repo_school.schools[escola_id] = School(
        id=escola_id, tenant_id=uuid.uuid4(), nome="Escola X"
    )
    
    with pytest.raises(ValueError, match="Escola não encontrada ou pertence a outro tenant"):
        await use_case.execute(input_dto)


@pytest.mark.asyncio
async def test_create_student_success(
    repo_student: MockStudentRepository, repo_school: MockSchoolRepository
) -> None:
    use_case = CreateStudentUseCase(student_repo=repo_student, school_repo=repo_school)
    
    tenant_id = uuid.uuid4()
    escola_id = uuid.uuid4()
    
    repo_school.schools[escola_id] = School(
        id=escola_id, tenant_id=tenant_id, nome="Escola Y"
    )

    input_dto = CreateStudentInput(
        nome="Maria",
        tenant_id=tenant_id,
        escola_atual_id=escola_id,
        consentimento_lgpd=True,
    )

    student = await use_case.execute(input_dto)
    
    assert student.id is not None
    assert student.nome == "Maria"
    assert student.consentimento_lgpd is True
    assert student.data_consentimento is not None
    assert student.status.value == "ativo"
