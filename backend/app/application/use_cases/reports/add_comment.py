import uuid
from dataclasses import dataclass

from app.application.ports.report_repository import ReportRepository
from app.domain.entities.report import Report
from app.domain.entities.user import PapelUsuario
from datetime import datetime, timezone

@dataclass
class AddCommentInput:
    report_id: uuid.UUID
    autor_id: uuid.UUID
    executor_papel: PapelUsuario
    texto: str

class AddCommentUseCase:
    def __init__(self, report_repo: ReportRepository):
        self.report_repo = report_repo

    async def execute(self, input_dto: AddCommentInput) -> Report:
        if input_dto.executor_papel != PapelUsuario.COORDENACAO:
            raise ValueError("Apenas usuários com papel de coordenação podem adicionar comentários.")

        report = await self.report_repo.get_by_id(input_dto.report_id)
        if not report:
            raise ValueError("Relatório não encontrado.")

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
