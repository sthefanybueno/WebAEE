import uuid
import pytest

from app.application.use_cases.schools.create_school import (
    CreateSchoolUseCase,
    CreateSchoolInput,
)
from app.application.use_cases.schools.list_schools import ListSchoolsUseCase
from app.domain.entities.school import School


class MockSchoolRepository:
    def __init__(self) -> None:
        self.schools: dict[uuid.UUID, School] = {}

    async def get_by_id(self, id: uuid.UUID) -> School | None:
        return self.schools.get(id)

    async def save(self, school: School) -> School:
        self.schools[school.id] = school
        return school

    async def list_by_tenant(self, tenant_id: uuid.UUID) -> list[School]:
        return [s for s in self.schools.values() if s.tenant_id == tenant_id]


@pytest.fixture
def repo() -> MockSchoolRepository:
    return MockSchoolRepository()


@pytest.mark.asyncio
async def test_create_school_success(repo: MockSchoolRepository) -> None:
    use_case = CreateSchoolUseCase(school_repo=repo)
    tenant_id = uuid.uuid4()

    result = await use_case.execute(
        CreateSchoolInput(tenant_id=tenant_id, nome="Escola Esperança")
    )

    assert result.id is not None
    assert result.nome == "Escola Esperança"
    assert result.tenant_id == tenant_id
    assert result.ativo is True


@pytest.mark.asyncio
async def test_create_school_persists_in_repo(repo: MockSchoolRepository) -> None:
    use_case = CreateSchoolUseCase(school_repo=repo)
    tenant_id = uuid.uuid4()

    school = await use_case.execute(
        CreateSchoolInput(tenant_id=tenant_id, nome="Escola Nova")
    )

    assert school.id in repo.schools
    assert repo.schools[school.id].nome == "Escola Nova"


@pytest.mark.asyncio
async def test_list_schools_returns_only_tenant_schools(repo: MockSchoolRepository) -> None:
    create_uc = CreateSchoolUseCase(school_repo=repo)
    list_uc = ListSchoolsUseCase(school_repo=repo)

    tenant_a = uuid.uuid4()
    tenant_b = uuid.uuid4()

    await create_uc.execute(CreateSchoolInput(tenant_id=tenant_a, nome="Escola A1"))
    await create_uc.execute(CreateSchoolInput(tenant_id=tenant_a, nome="Escola A2"))
    await create_uc.execute(CreateSchoolInput(tenant_id=tenant_b, nome="Escola B1"))

    result_a = await list_uc.execute(tenant_a)
    result_b = await list_uc.execute(tenant_b)

    assert len(result_a) == 2
    assert len(result_b) == 1
    assert all(s.tenant_id == tenant_a for s in result_a)
    assert result_b[0].nome == "Escola B1"


@pytest.mark.asyncio
async def test_list_schools_empty_tenant(repo: MockSchoolRepository) -> None:
    list_uc = ListSchoolsUseCase(school_repo=repo)
    result = await list_uc.execute(uuid.uuid4())
    assert result == []
