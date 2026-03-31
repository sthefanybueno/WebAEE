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
