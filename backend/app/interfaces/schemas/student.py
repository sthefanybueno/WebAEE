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


# ── Padrão Plain: base sem relações para evitar import circular ───────────────


class StudentPlain(BaseModel):
    """Campos diretos do aluno sem relações — base para herança.

    [DDD] Padrão Plain: schemas complexos herdam daqui, evitando
    importações circulares entre schemas que se referenciam.
    """

    id: uuid.UUID
    nome: str
    tenant_id: uuid.UUID
    escola_atual_id: Optional[uuid.UUID]
    status: str
    consentimento_lgpd: bool
    created_at: datetime
    updated_at: datetime


class StudentResponse(StudentPlain):
    """Schema de resposta padrão para alunos.

    NOTA LGPD: `diagnostico` e `laudo` são intencionalmente omitidos.
    Para acessar campos sensíveis, use /api/alunos/{id}/dados-sensiveis
    com justificativa obrigatória e auditoria automática.
    """

    pass


class StudentDetailResponse(StudentPlain):
    """Schema de detalhe de aluno — idêntico ao padrão.

    Em compliance com a LGPD (RN-26 e RN-27), nenhum dado de laudo
    ou diagnóstico vaza nesta rota geral de leitura.
    """

    pass


class StudentSensitiveDataResponse(BaseModel):
    """Schema para dados sensíveis — retornado apenas com justificativa LGPD.

    Movido do router para cá: schemas devem viver em schemas/, não em routers/.
    """

    diagnostico: Optional[str]
    laudo: Optional[str]


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
