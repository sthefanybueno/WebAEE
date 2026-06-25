import uuid

from pydantic import BaseModel, EmailStr

from app.domain.entities.user import PapelUsuario


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    nome: str
    papel: PapelUsuario
    escola_id: uuid.UUID | None = None
    aluno_ids: list[uuid.UUID] | None = []

class UserResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    email: EmailStr
    nome: str
    papel: PapelUsuario
    ativo: bool
    escola_id: uuid.UUID | None = None
    aluno_ids: list[uuid.UUID] = []

class UpdateUserRequest(BaseModel):
    nome: str
    papel: PapelUsuario
    escola_id: uuid.UUID | None = None
    aluno_ids: list[uuid.UUID] | None = []

class ToggleStatusRequest(BaseModel):
    ativo: bool

class UpdateProfileRequest(BaseModel):
    nome: str
    email: EmailStr
    escola_id: uuid.UUID | None = None

class UpdateProfileResponse(BaseModel):
    user: UserResponse
    access_token: str
