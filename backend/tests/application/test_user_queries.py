import uuid

import pytest

from app.application.use_cases.users.queries import (
    GetUserInput,
    GetUserUseCase,
    ListUsersInput,
    ListUsersUseCase,
)
from app.domain.entities.user import PapelUsuario, User
from app.domain.exceptions import UsuarioNaoEncontradoError


class MockUserRepository:
    def __init__(self, users=None):
        self.users = users or {}

    async def get_by_id(self, id: uuid.UUID):
        return self.users.get(id)

    async def get_by_email(self, email: str):
        for user in self.users.values():
            if user.email == email:
                return user
        return None

    async def save(self, user: User):
        self.users[user.id] = user
        return user

    async def list_by_tenant(
        self,
        tenant_id: uuid.UUID,
        nome: str | None = None,
        papel: str | None = None,
        page: int = 1,
        size: int = 50,
    ):
        items = [user for user in self.users.values() if user.tenant_id == tenant_id]
        if nome:
            items = [user for user in items if nome.lower() in user.nome.lower()]
        if papel:
            items = [user for user in items if user.papel == papel]
            
        total = len(items)
        start = (page - 1) * size
        items = items[start:start + size]
        return items, total


@pytest.mark.asyncio
async def test_list_users_use_case():
    # Given
    tenant_1 = uuid.uuid4()
    tenant_2 = uuid.uuid4()

    user_1 = User(id=uuid.uuid4(), tenant_id=tenant_1, nome="User 1", email="user1@example.com", hashed_password="hash", papel=PapelUsuario.COORDENACAO)
    user_2 = User(id=uuid.uuid4(), tenant_id=tenant_1, nome="User 2", email="user2@example.com", hashed_password="hash", papel=PapelUsuario.PROF_AEE)
    user_3 = User(id=uuid.uuid4(), tenant_id=tenant_2, nome="User 3", email="user3@example.com", hashed_password="hash", papel=PapelUsuario.COORDENACAO)

    repo = MockUserRepository({
        user_1.id: user_1,
        user_2.id: user_2,
        user_3.id: user_3,
    })

    use_case = ListUsersUseCase(user_repo=repo)

    # When / Then
    result_t1 = await use_case.execute(ListUsersInput(tenant_id=tenant_1))
    assert result_t1.total == 2
    assert len(result_t1.items) == 2
    assert user_1 in result_t1.items
    assert user_2 in result_t1.items

    result_t2 = await use_case.execute(ListUsersInput(tenant_id=tenant_2))
    assert result_t2.total == 1
    assert len(result_t2.items) == 1
    assert user_3 in result_t2.items

    result_empty = await use_case.execute(ListUsersInput(tenant_id=uuid.uuid4()))
    assert result_empty.total == 0
    assert len(result_empty.items) == 0

@pytest.mark.asyncio
async def test_list_users_use_case_filters_and_pagination():
    tenant_1 = uuid.uuid4()
    users = {
        uuid.uuid4(): User(id=uuid.uuid4(), tenant_id=tenant_1, nome=f"User {i}", email=f"user{i}@ex.com", hashed_password="h", papel=PapelUsuario.PROF_AEE)
        for i in range(10)
    }
    repo = MockUserRepository(users)
    use_case = ListUsersUseCase(user_repo=repo)

    # Test pagination
    res_page_1 = await use_case.execute(ListUsersInput(tenant_id=tenant_1, page=1, size=4))
    assert res_page_1.total == 10
    assert len(res_page_1.items) == 4

    res_page_3 = await use_case.execute(ListUsersInput(tenant_id=tenant_1, page=3, size=4))
    assert res_page_3.total == 10
    assert len(res_page_3.items) == 2

    # Test filter by name
    res_filter = await use_case.execute(ListUsersInput(tenant_id=tenant_1, nome="User 1"))
    assert res_filter.total == 1 # User 1
    assert res_filter.items[0].nome == "User 1"


@pytest.mark.asyncio
async def test_get_user_use_case_success():
    # Given
    tenant_id = uuid.uuid4()
    user = User(id=uuid.uuid4(), tenant_id=tenant_id, nome="User", email="user@example.com", hashed_password="hash", papel=PapelUsuario.COORDENACAO)

    repo = MockUserRepository({user.id: user})
    use_case = GetUserUseCase(user_repo=repo)

    # When
    result = await use_case.execute(GetUserInput(user_id=user.id, tenant_id=tenant_id))
    
    # Then
    assert result.id == user.id
    assert result.nome == "User"


@pytest.mark.asyncio
async def test_get_user_use_case_not_found():
    # Given
    tenant_id = uuid.uuid4()
    repo = MockUserRepository()
    use_case = GetUserUseCase(user_repo=repo)

    # When / Then
    with pytest.raises(UsuarioNaoEncontradoError):
        await use_case.execute(GetUserInput(user_id=uuid.uuid4(), tenant_id=tenant_id))


@pytest.mark.asyncio
async def test_get_user_use_case_wrong_tenant():
    # Given
    tenant_id_1 = uuid.uuid4()
    tenant_id_2 = uuid.uuid4()
    user = User(id=uuid.uuid4(), tenant_id=tenant_id_1, nome="User", email="user@example.com", hashed_password="hash", papel=PapelUsuario.COORDENACAO)

    repo = MockUserRepository({user.id: user})
    use_case = GetUserUseCase(user_repo=repo)

    # When / Then
    with pytest.raises(UsuarioNaoEncontradoError):
        await use_case.execute(GetUserInput(user_id=user.id, tenant_id=tenant_id_2))
