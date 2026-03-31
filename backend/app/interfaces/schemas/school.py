from pydantic import BaseModel
import uuid
from datetime import datetime

class CreateSchoolRequest(BaseModel):
    nome: str

class SchoolResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    nome: str
    ativo: bool
    created_at: datetime
    updated_at: datetime
