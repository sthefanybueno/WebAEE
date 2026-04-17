import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.interfaces.schemas.student import StudentDetailResponse
from app.interfaces.schemas.report import ReportResponse

class SyncPullResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    last_sync: datetime
    alunos: List[StudentDetailResponse] = []
    relatorios: List[ReportResponse] = []

class ResolveConflictRequest(BaseModel):
    report_id: uuid.UUID
    resolved_content: dict
