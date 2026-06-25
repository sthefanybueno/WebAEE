from typing import Optional
import uuid
from pydantic import BaseModel, EmailStr
from app.domain.entities.user import PapelUsuario

class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    nome: str
    papel: PapelUsuario
    escola_id: Optional[uuid.UUID] = None
    aluno_ids: Optional[list[uuid.UUID]] = []

class UserResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    email: EmailStr
    nome: str
    papel: PapelUsuario
    ativo: bool
    escola_id: Optional[uuid.UUID] = None
    aluno_ids: list[uuid.UUID] = []

class UpdateUserRequest(BaseModel):
    nome: str
    papel: PapelUsuario
    escola_id: Optional[uuid.UUID] = None
    aluno_ids: Optional[list[uuid.UUID]] = []

class ToggleStatusRequest(BaseModel):
    ativo: bool

class UpdateProfileRequest(BaseModel):
    nome: str
    email: EmailStr
    escola_id: Optional[uuid.UUID] = None

class UpdateProfileResponse(BaseModel):
    user: UserResponse
    access_token: str
