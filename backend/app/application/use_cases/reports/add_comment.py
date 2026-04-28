import uuid
from dataclasses import dataclass

from app.application.ports.report_repository import ReportRepository
from app.domain.entities.report import Report
from app.domain.entities.user import PapelUsuario
from datetime import datetime, timezone
from app.domain.exceptions import RelatorioNaoEncontradoError, PermissaoInsuficienteError

@dataclass
class AddCommentInput:
    report_id: uuid.UUID
    autor_id: uuid.UUID
    executor_papel: PapelUsuario
    texto: str

from sqlmodel.ext.asyncio.session import AsyncSession

class AddCommentUseCase:
    """Caso de uso para adição de comentários da coordenação em relatórios.
    
    Permite que a equipe gestora/coordenação valide e comente sobre o 
    conteúdo pedagógico produzido pelos professores, servindo como 
    ferramenta de feedback e supervisão.
    """
    def __init__(self, session: AsyncSession, report_repo: ReportRepository):
        self.session = session
        self.report_repo = report_repo

    async def execute(self, input_dto: AddCommentInput) -> Report:
        """Adiciona um comentário ao relatório especificado dentro de uma transação.
        """
        async with self.session.begin():
            if input_dto.executor_papel != PapelUsuario.COORDENACAO:
                raise PermissaoInsuficienteError(acao="adicionar comentário", papel_requerido="COORDENACAO")

            report = await self.report_repo.get_by_id(input_dto.report_id)
            if not report:
                raise RelatorioNaoEncontradoError(input_dto.report_id)

            # Injeta nos campos do relatorio
            if not report.conteudo_json:
                report.conteudo_json = {}
            
            comentarios = report.conteudo_json.get("comentarios", [])
            comentarios.append({
                "texto": input_dto.texto,
                "autor_id": str(input_dto.autor_id),
                "created_at": datetime.now(timezone.utc).replace(tzinfo=None).isoformat()
            })
            
            # Faz uma cópia rasa ou funda para garantir que o SQLAlchemy detecte a mutação em JSON(B)
            new_json = dict(report.conteudo_json)
            new_json["comentarios"] = comentarios
            report.conteudo_json = new_json

            return await self.report_repo.save(report)
