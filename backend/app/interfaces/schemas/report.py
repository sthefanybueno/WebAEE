from pydantic import BaseModel
from typing import List, Optional
import uuid
from app.domain.entities.report import TipoRelatorio
from datetime import datetime

class CreateReportRequest(BaseModel):
    tipo: TipoRelatorio
    aluno_id: uuid.UUID
    conteudo_json: dict

class ReportResponse(BaseModel):
    id: uuid.UUID
    tipo: TipoRelatorio
    aluno_id: uuid.UUID
    autor_id: uuid.UUID
    conteudo_json: dict
    created_at: datetime
    updated_at: datetime

class ReportDetailResponse(ReportResponse):
    """Retorna relatório com todos os detalhes incluindo o template para geração de PDF (RN-21)."""
    template_snapshot: Optional[dict] = None

class ReportTemplateResponse(BaseModel):
    id: uuid.UUID
    tipo: TipoRelatorio
    secoes: dict

class UpdateReportRequest(BaseModel):
    conteudo_json: dict

class AddCommentRequest(BaseModel):
    texto: str

class SyncReportItemRequest(BaseModel):
    id: uuid.UUID
    tipo: TipoRelatorio
    aluno_id: uuid.UUID
    conteudo_json: dict
    updated_at_local: datetime

class SyncReportRequest(BaseModel):
    items: List[SyncReportItemRequest]
