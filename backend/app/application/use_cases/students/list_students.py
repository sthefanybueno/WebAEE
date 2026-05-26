"""
Use Case: Listar Alunos
========================
Consulta a lista de alunos do tenant do usuário logado.

Extraído do endpoint GET /api/alunos/ que instanciava repositório
diretamente no Router — violação crítica de Clean Architecture.
"""

import uuid
from dataclasses import dataclass
from typing import List, Optional

from app.application.ports.student_repository import StudentRepository
from app.domain.models import StatusAluno, Student


@dataclass
class ListStudentsInput:
    tenant_id: uuid.UUID
    status: Optional[StatusAluno] = None


class ListStudentsUseCase:
    """Caso de uso para listar alunos de um tenant, com filtro opcional por status."""

    def __init__(self, student_repo: StudentRepository) -> None:
        self.student_repo = student_repo

    async def execute(self, input_dto: ListStudentsInput) -> List[Student]:
        """Retorna alunos do tenant, sem dados sensíveis (filtro aplicado pelo schema de resposta)."""
        return await self.student_repo.list_by_tenant(
            input_dto.tenant_id,
            status=input_dto.status,
        )
