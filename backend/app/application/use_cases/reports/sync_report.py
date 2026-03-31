import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from app.application.ports.report_repository import ReportRepository
from app.domain.entities.report import Report, SyncStatus


class ConcurrencyError(Exception):
    def __init__(self, message: str, server_version: Report) -> None:
        super().__init__(message)
        self.server_version = server_version


@dataclass
class SyncReportInput:
    report_id: uuid.UUID
    user_id: uuid.UUID
    conteudo_json: dict[str, Any]
    client_updated_at: datetime


class SyncReportUseCase:
    def __init__(self, report_repo: ReportRepository) -> None:
        self.report_repo = report_repo

    async def execute(self, input_dto: SyncReportInput) -> Report:
        report = await self.report_repo.get_by_id(input_dto.report_id)
        if not report:
            raise ValueError("Relatório não encontrado.")

        if report.travado:
            raise ValueError("Relatório finalizado não pode ser alterado.")

        # Comparação exata ou garantindo timezone_aware:
        # Se os horários de atualização divergirem indicando que
        # o servidor sofreu uma mutação posterior à base de sincronismo do cliente
        if report.updated_at > input_dto.client_updated_at:
            report.conflict_flag = True
            await self.report_repo.save(report)
            raise ConcurrencyError(
                "Conflito detectado na sincronização.", server_version=report
            )

        # Atualização bem-sucedida (Merges complexos não existem no MVP; último a salvar ganha)
        report.conteudo_json = input_dto.conteudo_json
        report.conflict_flag = False
        report.sync_status = SyncStatus.SYNCED
        report.updated_by = input_dto.user_id
        report.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

        return await self.report_repo.save(report)
