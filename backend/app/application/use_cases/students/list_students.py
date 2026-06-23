"""
Use Case: Listar Alunos
========================
Consulta a lista de alunos com filtro RBAC por papel.

Regras:
- ADMIN: vê todos os alunos (sem filtro de tenant)
- COORDENACAO: vê todos do tenant
- PROF_AEE: vê apenas alunos vinculados a ela (professor_assignment)
- PROF_APOIO: vê apenas o aluno vinculado a ela (apoio_id)
- PROF_REGENTE: vê apenas alunos vinculados a ela (professor_assignment)
"""

import uuid
from dataclasses import dataclass
from typing import List, Optional

from app.application.ports.student_repository import StudentRepository
from app.domain.entities.user import PapelUsuario
from app.domain.models import StatusAluno, Student


@dataclass
class ListStudentsInput:
    tenant_id: uuid.UUID
    papel: PapelUsuario
    user_id: uuid.UUID
    status: Optional[StatusAluno] = None
    escola_id: Optional[uuid.UUID] = None


class ListStudentsUseCase:
    """Caso de uso para listar alunos com filtro RBAC."""

    def __init__(self, student_repo: StudentRepository) -> None:
        self.student_repo = student_repo

    async def execute(self, input_dto: ListStudentsInput) -> List[Student]:
        """Retorna alunos aplicando regra RBAC conforme papel do usuário."""
        # ADMIN: acesso irrestrito a todos os tenants
        if input_dto.papel == PapelUsuario.ADMIN:
            return await self.student_repo.list_by_tenant(
                tenant_id=None,
                status=input_dto.status,
                escola_id=input_dto.escola_id,
            )

        # COORDENACAO: vê todos os alunos do tenant
        if input_dto.papel == PapelUsuario.COORDENACAO:
            return await self.student_repo.list_by_tenant(
                tenant_id=input_dto.tenant_id,
                status=input_dto.status,
                escola_id=input_dto.escola_id,
            )

        # PROF_AEE, PROF_APOIO, PROF_REGENTE: filtro por professor_assignment
        return await self.student_repo.list_by_tenant(
            tenant_id=input_dto.tenant_id,
            status=input_dto.status,
            professor_id=input_dto.user_id,
            escola_id=input_dto.escola_id,
        )
