import uuid
from dataclasses import dataclass

from app.application.ports.report_repository import ReportRepository
from app.application.ports.report_template_repository import (
    ReportTemplateRepository,
)
from app.application.ports.student_repository import StudentRepository
from app.domain.entities.report import Report, TipoRelatorio
from app.domain.entities.user import PapelUsuario


@dataclass
class CreateReportInput:
    tipo: TipoRelatorio
    aluno_id: uuid.UUID
    autor_id: uuid.UUID
    tenant_id: uuid.UUID
    papel_autor: PapelUsuario
    conteudo_json: dict


class CreateReportUseCase:
    def __init__(
        self,
        report_repo: ReportRepository,
        template_repo: ReportTemplateRepository,
        student_repo: StudentRepository,
    ) -> None:
        self.report_repo = report_repo
        self.template_repo = template_repo
        self.student_repo = student_repo

    async def execute(self, input_dto: CreateReportInput) -> Report:
        # 1. Validar se o aluno existe e pertence ao tenant
        student = await self.student_repo.get_by_id(input_dto.aluno_id)
        if not student or student.tenant_id != input_dto.tenant_id:
            raise ValueError("Aluno não encontrado ou não pertence a este tenant.")

        # 2. Validar permissão (Mock: vamos assumir que apenas prof_aee ou equipe_gestora pode criar)
        if input_dto.papel_autor not in (
            PapelUsuario.PROF_AEE,
            PapelUsuario.COORDENACAO,
        ):
            raise ValueError("Papel de usuário não permitido para este tipo de relatório.")

        # 3. Validar se há um template ativo para esse tipo (opcional, pode ser ignorado no MVP, mas implementado aqui)
        template = await self.template_repo.get_active_by_tipo(input_dto.tipo)
        if not template:
            # Em um sistema robusto, poderíamos rejeitar ou usar schema base.
            pass

        # 4. Criar o Relatório
        report = Report(
            tipo=input_dto.tipo,
            aluno_id=input_dto.aluno_id,
            autor_id=input_dto.autor_id,
            conteudo_json=input_dto.conteudo_json,
            template_snapshot=template.model_dump() if template else None
        )

        return await self.report_repo.save(report)
