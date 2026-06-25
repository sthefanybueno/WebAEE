"""
Use Case: Listar Templates de Relatório
=========================================
Retorna todos os templates de relatório disponíveis no sistema.

Extração da lógica que estava incorretamente no router de relatórios,
que importava ORM models diretamente na camada de interface.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List

from app.application.ports.unit_of_work import AbstractUnitOfWork

from app.application.ports.report_template_repository import ReportTemplateRepository
from app.domain.entities.report import ReportTemplate


from app.domain.entities.user import PapelUsuario

@dataclass
class ListTemplatesInput:
    """DTO de entrada para listar templates."""
    papel_usuario: PapelUsuario


class ListTemplatesUseCase:
    """Lista todos os templates de relatório do sistema.

    Não há isolamento por tenant neste use case porque templates são
    configurações globais do sistema (não pertencem a nenhum tenant).
    """

    def __init__(
        self,
        uow: AbstractUnitOfWork,
        template_repo: ReportTemplateRepository,
    ) -> None:
        self.uow = uow
        self.template_repo = template_repo

    async def execute(self, input_dto: ListTemplatesInput) -> List[ReportTemplate]:
        """Retorna todos os templates disponíveis para o papel informado."""
        all_templates = await self.template_repo.list_all()
        return [t for t in all_templates if t.papel_pode_visualizar(str(input_dto.papel_usuario.value))]
