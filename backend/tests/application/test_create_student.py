import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import pytest

from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.application.use_cases.students.create_student import (
    CreateStudentInput,
    CreateStudentUseCase,
)
from app.domain.entities.school import School
from app.domain.exceptions import (
    ConsentimentoLGPDAusenteError,
    EscolaNaoEncontradaError,
    TenantMismatchError,
)
from app.domain.models import Student


class MockUnitOfWork(AbstractUnitOfWork):
    @asynccontextmanager
    async def transaction(self) -> AsyncIterator[None]:
        yield


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
    # Given
    use_case = CreateStudentUseCase(uow=MockUnitOfWork(), student_repo=repo_student, school_repo=repo_school)
    
    tenant_id = uuid.uuid4()
    escola_id = uuid.uuid4()
    
    input_dto = CreateStudentInput(
        nome="João da Silva",
        tenant_id=tenant_id,
        escola_atual_id=escola_id,
        consentimento_lgpd=False,
    )

    # When / Then
    with pytest.raises(ConsentimentoLGPDAusenteError):
        await use_case.execute(input_dto)


@pytest.mark.asyncio
async def test_create_student_school_not_found_or_invalid_tenant(
    repo_student: MockStudentRepository, repo_school: MockSchoolRepository
) -> None:
    # Given
    use_case = CreateStudentUseCase(uow=MockUnitOfWork(), student_repo=repo_student, school_repo=repo_school)
    
    tenant_id = uuid.uuid4()
    escola_id = uuid.uuid4()
    
    # Escola não está no repositório mock
    input_dto = CreateStudentInput(
        nome="João",
        tenant_id=tenant_id,
        escola_atual_id=escola_id,
        consentimento_lgpd=True,
    )

    # When / Then
    with pytest.raises(EscolaNaoEncontradaError):
        await use_case.execute(input_dto)

    # Given (Escola existe mas em outro tenant)
    repo_school.schools[escola_id] = School(
        id=escola_id, tenant_id=uuid.uuid4(), nome="Escola X"
    )

    # When / Then
    with pytest.raises(TenantMismatchError):
        await use_case.execute(input_dto)


@pytest.mark.asyncio
async def test_create_student_success(
    repo_student: MockStudentRepository, repo_school: MockSchoolRepository
) -> None:
    # Given
    use_case = CreateStudentUseCase(uow=MockUnitOfWork(), student_repo=repo_student, school_repo=repo_school)
    
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

    # When
    student = await use_case.execute(input_dto)
    
    # Then
    assert student.id is not None
    assert student.nome == "Maria"
    assert student.consentimento_lgpd is True
    assert student.data_consentimento is not None
    assert student.status.value == "ativo"
