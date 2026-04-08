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

class StudentDetailResponse(StudentResponse):
    """
    Schema idêntico ao StudentResponse listado.
    Em compliance com a LGPD (RN-26 e RN-27), nenhum dado de laudo
    ou diagnóstico vaza nesta rota geral de leitura.
    """
    pass

class UpdateStudentRequest(BaseModel):
    """Payload para edição básica de alunos (sem laudo/diagnóstico)."""
    nome: Optional[str] = None
    data_nascimento: Optional[datetime] = None

from app.domain.entities.user import PapelUsuario

class CreateProfessorAssignmentRequest(BaseModel):
    usuario_id: uuid.UUID
    tipo_papel: PapelUsuario

class ProfessorAssignmentResponse(BaseModel):
    id: uuid.UUID
    usuario_id: uuid.UUID
    escola_id: uuid.UUID
    aluno_id: uuid.UUID
    tipo_papel: PapelUsuario
    data_inicio: datetime
    data_fim: Optional[datetime]
