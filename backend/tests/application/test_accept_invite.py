import uuid
import pytest

from app.application.use_cases.users.accept_invite import (
    AcceptInviteUseCase,
    AcceptInviteInput,
    InvalidInviteTokenError,
    UserAlreadyActiveError,
)
from app.domain.entities.user import User, PapelUsuario
from app.infrastructure.security.tokens import create_invite_token
from app.infrastructure.security.passwords import verify_password

class MockAsyncSession:
    def begin(self): return self
    async def __aenter__(self): return self
    async def __aexit__(self, t, v, tb): pass


class MockUserRepository:
    def __init__(self, users: dict[uuid.UUID, User] = None) -> None:
        self.users = users or {}

    async def get_by_id(self, id: uuid.UUID) -> User | None:
        return self.users.get(id)

    async def save(self, user: User) -> User:
        self.users[user.id] = user
        return user


@pytest.mark.asyncio
async def test_accept_invite_success() -> None:
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        tenant_id=uuid.uuid4(),
        email="test@escola.com",
        nome="Test",
        papel=PapelUsuario.PROF_AEE,
        hashed_password="PENDING_INVITE",
        ativo=False,
    )
    repo = MockUserRepository({user_id: user})
    use_case = AcceptInviteUseCase(session=MockAsyncSession(), user_repo=repo)
    
    token = create_invite_token(user_id)
    input_dto = AcceptInviteInput(token=token, nova_senha="SenhaForte123")
    
    updated_user = await use_case.execute(input_dto)
    
    assert updated_user.ativo is True
    assert updated_user.hashed_password != "PENDING_INVITE"
    assert verify_password("SenhaForte123", updated_user.hashed_password) is True


@pytest.mark.asyncio
async def test_accept_invite_invalid_token() -> None:
    use_case = AcceptInviteUseCase(session=MockAsyncSession(), user_repo=MockUserRepository())
    input_dto = AcceptInviteInput(token="token_invalido_ou_expirado", nova_senha="SenhaForte123")
    
    with pytest.raises(InvalidInviteTokenError):
        await use_case.execute(input_dto)


@pytest.mark.asyncio
async def test_accept_invite_user_not_found() -> None:
    # Token válido, mas usuário foi deletado/não existe no banco
    user_id = uuid.uuid4()
    repo = MockUserRepository({})
    use_case = AcceptInviteUseCase(session=MockAsyncSession(), user_repo=repo)
    
    token = create_invite_token(user_id)
    input_dto = AcceptInviteInput(token=token, nova_senha="SenhaForte123")
    
    with pytest.raises(InvalidInviteTokenError):
        await use_case.execute(input_dto)


@pytest.mark.asyncio
async def test_accept_invite_already_active() -> None:
    user_id = uuid.uuid4()
    # Usuário que já aceitou o convite (ativo e senha diferente de PENDING)
    user = User(
        id=user_id,
        tenant_id=uuid.uuid4(),
        email="test@escola.com",
        nome="Test",
        papel=PapelUsuario.PROF_AEE,
        hashed_password="HASH_ANTIGO_AQUI",
        ativo=True,
    )
    repo = MockUserRepository({user_id: user})
    use_case = AcceptInviteUseCase(session=MockAsyncSession(), user_repo=repo)
    
    # Ele pega um token antigo válido e tenta usar de novo
    token = create_invite_token(user_id)
    input_dto = AcceptInviteInput(token=token, nova_senha="OutraSenha123")
    
    with pytest.raises(UserAlreadyActiveError):
        await use_case.execute(input_dto)
