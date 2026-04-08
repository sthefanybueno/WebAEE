import uuid
from pydantic import BaseModel, EmailStr
from app.domain.entities.user import PapelUsuario

class CreateUserRequest(BaseModel):
    email: EmailStr
    nome: str
    papel: PapelUsuario
    escola_ids: list[uuid.UUID]

class UserResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    email: EmailStr
    nome: str
    papel: PapelUsuario
    ativo: bool
