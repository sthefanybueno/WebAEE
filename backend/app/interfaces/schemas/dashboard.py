from pydantic import BaseModel
from datetime import datetime
from typing import List

class ActivityItem(BaseModel):
    id: str
    type: str
    description: str
    created_at: datetime

class DashboardResponse(BaseModel):
    total_alunos_ativos: int
    total_relatorios_pendentes: int # Relatórios não travados
    total_fotos_hoje: int
    recent_activities: List[ActivityItem]
