from pydantic import BaseModel

class DashboardResponse(BaseModel):
    total_alunos_ativos: int
    total_relatorios_pendentes: int # Relatórios não travados
    total_fotos_hoje: int
