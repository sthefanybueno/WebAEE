from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid
from datetime import datetime

class CreateReportTemplateRequest(BaseModel):
    nome: str
    descricao: str
    secoes: dict

class ReportTemplateCreate(BaseModel):
    nome: str
    descricao: str
    secoes: dict

class ReportTemplateResponse(BaseModel):
    id: uuid.UUID
    nome: str
    descricao: str
    secoes: dict
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
    template_snapshot: Optional[dict] = None

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
    items: List[SyncReportItemRequest]
