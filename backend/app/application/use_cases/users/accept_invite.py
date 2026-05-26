from pydantic import BaseModel, Field
from app.application.ports.unit_of_work import AbstractUnitOfWork

from app.application.ports.user_repository import UserRepository
from app.domain.entities.user import User
from app.infrastructure.security.tokens import decode_invite_token
from app.infrastructure.security.passwords import get_password_hash
from app.domain.exceptions import DomainException

class InvalidInviteTokenError(DomainException):
    def __init__(self) -> None:
        super().__init__("Token de convite inválido ou expirado.")

class UserAlreadyActiveError(DomainException):
    def __init__(self) -> None:
        super().__init__("Usuário já está ativo ou já aceitou o convite.")

class AcceptInviteInput(BaseModel):
    token: str = Field(description="Token JWT recebido por e-mail")
    nova_senha: str = Field(min_length=6, max_length=100, description="Senha definida pelo usuário")

class AcceptInviteUseCase:
    """Caso de uso para usuário recém-criado definir sua senha via link mágico."""
    
    def __init__(self, uow: AbstractUnitOfWork, user_repo: UserRepository):
        self.uow = uow
        self.user_repo = user_repo
        
    async def execute(self, input_dto: AcceptInviteInput) -> User:
        user_id = decode_invite_token(input_dto.token)
        if not user_id:
            raise InvalidInviteTokenError()
            
        async with self.uow.transaction():
            user = await self.user_repo.get_by_id(user_id)
            if not user:
                raise InvalidInviteTokenError()
                
            if user.ativo and user.hashed_password != "PENDING_INVITE":
                raise UserAlreadyActiveError()
                
            user.hashed_password = get_password_hash(input_dto.nova_senha)
            user.ativo = True
            
            return await self.user_repo.save(user)
