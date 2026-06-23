import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

class CreateScheduleRequest(BaseModel):
    aluno_id: uuid.UUID
    dia_semana: str = Field(description="Ex: seg, ter, qua, qui, sex")
    hora: str = Field(description="Ex: 07h30")
    atividade: str
    tipo_slot: str = Field(default="normal")

class ScheduleResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    aluno_id: uuid.UUID
    dia_semana: str
    hora: str
    atividade: str
    tipo_slot: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
