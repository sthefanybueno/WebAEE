import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CreateStudentRequest(BaseModel):
    nome: str = Field(min_length=2, max_length=255)
    escola_atual_id: uuid.UUID
    consentimento_lgpd: bool = Field(description="Exigido LGPD")
    data_nascimento: Optional[datetime] = None
    diagnostico: Optional[str] = Field(default=None, description="Dado sensível")
    laudo: Optional[str] = Field(default=None, description="Dado sensível")
    base_legal: str = "Art. 58 LDB"


class ArchiveStudentRequest(BaseModel):
    pass  # Geralmente recebido via param ID


class TransferStudentRequest(BaseModel):
    nova_escola_id: uuid.UUID


class StudentResponse(BaseModel):
    """
    Schema de resposta para alunos.
    NOTA LGPD: `diagnostico` e `laudo` são intencionalmente omitidos.
    Para acessar campos sensíveis, um endpoint específico com auditoria é necessário.
    """

    id: uuid.UUID
    nome: str
    tenant_id: uuid.UUID
    escola_atual_id: Optional[uuid.UUID]
    status: str
    consentimento_lgpd: bool
    created_at: datetime
    updated_at: datetime
