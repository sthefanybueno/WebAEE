import uuid
from datetime import datetime

from pydantic import BaseModel


class CreateReportTemplateRequest(BaseModel):
    nome: str
    descricao: str
    papeis_com_acesso: list[str] = []
    secoes: dict

class ReportTemplateCreate(BaseModel):
    nome: str
    descricao: str
    papeis_com_acesso: list[str] = []
    secoes: dict

class ReportTemplateResponse(BaseModel):
    id: uuid.UUID
    nome: str
    descricao: str
    secoes: dict
    papeis_com_acesso: list[str]
    versao: int
    ativo: bool

class CreateReportRequest(BaseModel):
    template_id: uuid.UUID
    aluno_id: uuid.UUID
    conteudo_json: dict

class ReportResponse(BaseModel):
    id: uuid.UUID
    template_id: uuid.UUID
    aluno_id: uuid.UUID
    autor_id: uuid.UUID
    conteudo_json: dict
    created_at: datetime
    updated_at: datetime

class ReportDetailResponse(ReportResponse):
    """Retorna relatório com todos os detalhes incluindo o template para geração de PDF (RN-21)."""
    template_snapshot: dict | None = None

class UpdateReportRequest(BaseModel):
    conteudo_json: dict

class AddCommentRequest(BaseModel):
    texto: str

class SyncReportItemRequest(BaseModel):
    id: uuid.UUID
    template_id: uuid.UUID
    aluno_id: uuid.UUID
    conteudo_json: dict
    updated_at_local: datetime

class SyncReportRequest(BaseModel):
    items: list[SyncReportItemRequest]
