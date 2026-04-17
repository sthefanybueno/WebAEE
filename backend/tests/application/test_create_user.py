"""
Testes unitários para CreateUserUseCase.
Cobre: RBAC por papel, duplicidade de e-mail, criação bem-sucedida.
"""
import uuid
import pytest

from app.application.use_cases.users.create_user import CreateUserInput, CreateUserUseCase
from app.domain.entities.user import User, PapelUsuario

class MockAsyncSession:
    def begin(self): return self
    async def __aenter__(self): return self
    async def __aexit__(self, t, v, tb): pass



class MockUserRepository:
    def __init__(self) -> None:
        self.users: dict[str, User] = {}

    async def get_by_email(self, email: str) -> User | None:
        return self.users.get(email)

    async def save(self, user: User) -> User:
        self.users[user.email] = user
        return user


@pytest.fixture
def repo() -> MockUserRepository:
    return MockUserRepository()


def make_input(
    executor_papel: PapelUsuario,
    papel: PapelUsuario,
    email: str = "novo@escola.edu.br",
) -> CreateUserInput:
    return CreateUserInput(
        tenant_id=uuid.uuid4(),
        executor_papel=executor_papel,
        email=email,
        nome="Novo Usuário",
        papel=papel,
    )


@pytest.mark.asyncio
async def test_criar_usuario_coordenacao_sucesso(repo: MockUserRepository) -> None:
    use_case = CreateUserUseCase(session=MockAsyncSession(), user_repo=repo)
    inp = make_input(PapelUsuario.COORDENACAO, PapelUsuario.PROF_AEE)
    user = await use_case.execute(inp)
    assert user.email == "novo@escola.edu.br"
    assert user.papel == PapelUsuario.PROF_AEE


@pytest.mark.asyncio
async def test_criar_admin_requer_executor_admin(repo: MockUserRepository) -> None:
    use_case = CreateUserUseCase(session=MockAsyncSession(), user_repo=repo)
    inp = make_input(PapelUsuario.COORDENACAO, PapelUsuario.ADMIN)
    with pytest.raises(ValueError, match="Apenas Admin"):
        await use_case.execute(inp)


@pytest.mark.asyncio
async def test_prof_aee_so_pode_criar_prof_apoio(repo: MockUserRepository) -> None:
    use_case = CreateUserUseCase(session=MockAsyncSession(), user_repo=repo)
    inp = make_input(PapelUsuario.PROF_AEE, PapelUsuario.PROF_AEE)
    with pytest.raises(ValueError, match="Profissional de Apoio"):
        await use_case.execute(inp)


@pytest.mark.asyncio
async def test_prof_apoio_nao_pode_criar_usuario(repo: MockUserRepository) -> None:
    use_case = CreateUserUseCase(session=MockAsyncSession(), user_repo=repo)
    inp = make_input(PapelUsuario.PROF_APOIO, PapelUsuario.PROF_APOIO)
    with pytest.raises(ValueError, match="não tem permissão"):
        await use_case.execute(inp)


@pytest.mark.asyncio
async def test_email_duplicado_levanta_erro(repo: MockUserRepository) -> None:
    use_case = CreateUserUseCase(session=MockAsyncSession(), user_repo=repo)
    inp = make_input(PapelUsuario.COORDENACAO, PapelUsuario.PROF_AEE, email="dup@escola.edu.br")
    await use_case.execute(inp)  # primeira criação
    with pytest.raises(ValueError, match="já está em uso"):
        await use_case.execute(inp)


@pytest.mark.asyncio
async def test_admin_cria_outro_admin(repo: MockUserRepository) -> None:
    use_case = CreateUserUseCase(session=MockAsyncSession(), user_repo=repo)
    inp = make_input(PapelUsuario.ADMIN, PapelUsuario.ADMIN)
    user = await use_case.execute(inp)
    assert user.papel == PapelUsuario.ADMIN


@pytest.mark.asyncio
async def test_prof_aee_cria_prof_apoio_sucesso(repo: MockUserRepository) -> None:
    use_case = CreateUserUseCase(session=MockAsyncSession(), user_repo=repo)
    inp = make_input(PapelUsuario.PROF_AEE, PapelUsuario.PROF_APOIO)
    user = await use_case.execute(inp)
    assert user.papel == PapelUsuario.PROF_APOIO
