import uuid
from dataclasses import dataclass

from app.application.ports.report_repository import ReportRepository
from app.application.ports.report_template_repository import (
    ReportTemplateRepository,
)
from app.application.ports.student_repository import StudentRepository
from app.domain.entities.report import Report
from app.domain.entities.user import PapelUsuario
from app.domain.exceptions import AlunoNaoEncontradoError, PermissaoInsuficienteError
from app.domain.exceptions import DomainException


@dataclass
class CreateReportInput:
    template_id: uuid.UUID
    aluno_id: uuid.UUID
    autor_id: uuid.UUID
    tenant_id: uuid.UUID
    papel_autor: PapelUsuario
    conteudo_json: dict


from app.application.ports.unit_of_work import AbstractUnitOfWork

class CreateReportUseCase:
    """Caso de uso para criação de relatórios pedagógicos (PEI, Plano de AEE, etc).
    
    Responsável por validar a existência do aluno no tenant correto, 
    verificar o papel do autor (RBAC) e anexar o snapshot do template 
    utilizado no momento da criação, garantindo que alterações futuras 
    no template não corrompam relatórios históricos.
    """
    def __init__(
        self,
        uow: AbstractUnitOfWork,
        report_repo: ReportRepository,
        template_repo: ReportTemplateRepository,
        student_repo: StudentRepository,
    ) -> None:
        self.uow = uow
        self.report_repo = report_repo
        self.template_repo = template_repo
        self.student_repo = student_repo

    async def execute(self, input_dto: CreateReportInput) -> Report:
        """Cria um novo relatório para um aluno dentro de uma transação.
        """
        async with self.uow.transaction():
            # 1. Validar se o aluno existe e pertence ao tenant
            student = await self.student_repo.get_by_id(input_dto.aluno_id)
            if not student or student.tenant_id != input_dto.tenant_id:
                raise AlunoNaoEncontradoError(input_dto.aluno_id)

            # 2. Validar permissão (Mock: vamos assumir que apenas prof_aee ou equipe_gestora pode criar)
            if input_dto.papel_autor not in (
                PapelUsuario.PROF_AEE,
                PapelUsuario.COORDENACAO,
                PapelUsuario.PROF_REGENTE,
                PapelUsuario.PROF_APOIO,
                PapelUsuario.ADMIN,
            ):
                raise PermissaoInsuficienteError(acao="criar relatório")

            # 3. Validar se há um template ativo para esse tipo
            template = await self.template_repo.get_by_id(input_dto.template_id)
            if not template:
                raise DomainException(f"Template com ID {input_dto.template_id} não encontrado ou inativo.")

            # 4. Criar o Relatório
            report = Report(
                template_id=input_dto.template_id,
                aluno_id=input_dto.aluno_id,
                autor_id=input_dto.autor_id,
                conteudo_json=input_dto.conteudo_json,
                template_snapshot=template.model_dump(mode="json") if template else None
            )

            return await self.report_repo.save(report)
