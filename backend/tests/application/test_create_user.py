import uuid
import pytest

from app.application.use_cases.users.create_user import (
    CreateUserUseCase,
    CreateUserInput,
)
from app.domain.entities.user import User, PapelUsuario


class MockUserRepository:
    def __init__(self) -> None:
        self.users: dict[uuid.UUID, User] = {}
        self.by_email: dict[str, User] = {}

    async def get_by_email(self, email: str) -> User | None:
        return self.by_email.get(email)

    async def save(self, user: User) -> User:
        self.users[user.id] = user
        self.by_email[user.email] = user
        return user


@pytest.fixture
def repo() -> MockUserRepository:
    return MockUserRepository()


def _input(
    executor: PapelUsuario,
    papel: PapelUsuario,
    email: str = "test@escola.edu.br",
    tenant_id: uuid.UUID | None = None,
) -> CreateUserInput:
    return CreateUserInput(
        tenant_id=tenant_id or uuid.uuid4(),
        executor_papel=executor,
        email=email,
        nome="Usuário Teste",
        papel=papel,
    )


@pytest.mark.asyncio
async def test_admin_can_create_any_role(repo: MockUserRepository) -> None:
    uc = CreateUserUseCase(user_repo=repo)
    for papel in PapelUsuario:
        email = f"{papel.value}@escola.edu.br"
        user = await uc.execute(_input(PapelUsuario.ADMIN, papel, email=email))
        assert user.papel == papel


@pytest.mark.asyncio
async def test_non_admin_cannot_create_admin(repo: MockUserRepository) -> None:
    uc = CreateUserUseCase(user_repo=repo)
    with pytest.raises(ValueError, match="Apenas Admin pode criar outro Admin"):
        await uc.execute(_input(PapelUsuario.COORDENACAO, PapelUsuario.ADMIN))


@pytest.mark.asyncio
async def test_prof_aee_can_only_create_prof_apoio(repo: MockUserRepository) -> None:
    uc = CreateUserUseCase(user_repo=repo)

    # Sucesso: criar prof_apoio
    user = await uc.execute(
        _input(PapelUsuario.PROF_AEE, PapelUsuario.PROF_APOIO, email="apoio@escola.br")
    )
    assert user.papel == PapelUsuario.PROF_APOIO

    # Falha: tentar criar qualquer outro papel
    for papel in (PapelUsuario.COORDENACAO, PapelUsuario.PROF_AEE, PapelUsuario.PROF_REGENTE):
        with pytest.raises(ValueError, match="Prof. AEE só tem permissão"):
            await uc.execute(
                _input(PapelUsuario.PROF_AEE, papel, email=f"x_{papel.value}@escola.br")
            )


@pytest.mark.asyncio
async def test_prof_regente_cannot_create_users(repo: MockUserRepository) -> None:
    uc = CreateUserUseCase(user_repo=repo)
    with pytest.raises(ValueError, match="Você não tem permissão"):
        await uc.execute(_input(PapelUsuario.PROF_REGENTE, PapelUsuario.PROF_APOIO))


@pytest.mark.asyncio
async def test_prof_apoio_cannot_create_users(repo: MockUserRepository) -> None:
    uc = CreateUserUseCase(user_repo=repo)
    with pytest.raises(ValueError, match="Você não tem permissão"):
        await uc.execute(_input(PapelUsuario.PROF_APOIO, PapelUsuario.PROF_APOIO))


@pytest.mark.asyncio
async def test_duplicate_email_raises_error(repo: MockUserRepository) -> None:
    uc = CreateUserUseCase(user_repo=repo)
    email = "duplicado@escola.br"

    await uc.execute(_input(PapelUsuario.ADMIN, PapelUsuario.COORDENACAO, email=email))

    with pytest.raises(ValueError, match="E-mail já está em uso"):
        await uc.execute(_input(PapelUsuario.ADMIN, PapelUsuario.COORDENACAO, email=email))


@pytest.mark.asyncio
async def test_coordenacao_can_create_allowed_roles(repo: MockUserRepository) -> None:
    uc = CreateUserUseCase(user_repo=repo)
    allowed = [PapelUsuario.COORDENACAO, PapelUsuario.PROF_AEE, PapelUsuario.PROF_APOIO, PapelUsuario.PROF_REGENTE]
    for papel in allowed:
        email = f"coord_{papel.value}@escola.br"
        user = await uc.execute(_input(PapelUsuario.COORDENACAO, papel, email=email))
        assert user.papel == papel
