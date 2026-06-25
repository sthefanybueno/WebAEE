import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.interfaces.schemas.report import ReportResponse
from app.interfaces.schemas.student import StudentDetailResponse


class SyncPullResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    last_sync: datetime
    alunos: list[StudentDetailResponse] = []
    relatorios: list[ReportResponse] = []

class ResolveConflictRequest(BaseModel):
    report_id: uuid.UUID
    resolved_content: dict
