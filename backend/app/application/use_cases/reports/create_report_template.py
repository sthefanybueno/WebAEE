from dataclasses import dataclass

from app.application.ports.report_template_repository import ReportTemplateRepository
from app.application.ports.unit_of_work import AbstractUnitOfWork
from app.domain.entities.report import ReportTemplate
from app.domain.entities.user import PapelUsuario
from app.domain.exceptions import PermissaoInsuficienteError

@dataclass
class CreateReportTemplateInput:
    nome: str
    descricao: str
    secoes: dict
    papel_autor: PapelUsuario

class CreateReportTemplateUseCase:
    """Caso de uso para criação de Tipos de Relatório (Templates)."""
    
    def __init__(
        self,
        uow: AbstractUnitOfWork,
        template_repo: ReportTemplateRepository,
    ) -> None:
        self.uow = uow
        self.template_repo = template_repo

    async def execute(self, input_dto: CreateReportTemplateInput) -> ReportTemplate:
        async with self.uow.transaction():
            # Apenas Coordenação e Admin deveriam criar templates base
            if input_dto.papel_autor not in (PapelUsuario.ADMIN, PapelUsuario.COORDENACAO):
                raise PermissaoInsuficienteError(acao="criar tipo de relatório")

            template = ReportTemplate(
                nome=input_dto.nome,
                descricao=input_dto.descricao,
                secoes=input_dto.secoes,
                versao=1,
                ativo=True
            )

            return await self.template_repo.save(template)
