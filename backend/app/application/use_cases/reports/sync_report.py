import uuid
from dataclasses import dataclass
from typing import List

from app.application.ports.report_repository import ReportRepository
from app.application.ports.student_repository import StudentRepository
from app.domain.entities.report import Report, TipoRelatorio
from datetime import datetime, timezone


def _to_naive_utc(dt: datetime) -> datetime:
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


class ConcurrencyError(ValueError):
    pass

@dataclass
class SyncReportInput:
    id: uuid.UUID
    tipo: TipoRelatorio
    aluno_id: uuid.UUID
    autor_id: uuid.UUID
    tenant_id: uuid.UUID
    conteudo_json: dict
    updated_at_local: datetime

class SyncReportUseCase:
    def __init__(self, report_repo: ReportRepository, student_repo: StudentRepository):
        self.report_repo = report_repo
        self.student_repo = student_repo

    async def execute(self, inputs: List[SyncReportInput]) -> List[Report]:
        synced = []
        for input_dto in inputs:
            student = await self.student_repo.get_by_id(input_dto.aluno_id)
            if not student or student.tenant_id != input_dto.tenant_id:
                continue

            existing = await self.report_repo.get_by_id(input_dto.id)
            updated_at_naive = _to_naive_utc(input_dto.updated_at_local)
            if existing:
                if existing.updated_at > updated_at_naive:
                    existing.conflict_flag = True
                    await self.report_repo.save(existing)
                    raise ConcurrencyError("Conflito detectado na sincronização")
                    
                existing.conteudo_json = input_dto.conteudo_json
                existing.updated_at = updated_at_naive
                saved = await self.report_repo.save(existing)
                synced.append(saved)

            else:
                report = Report(
                    id=input_dto.id,
                    tipo=input_dto.tipo,
                    aluno_id=input_dto.aluno_id,
                    autor_id=input_dto.autor_id,
                    conteudo_json=input_dto.conteudo_json,
                )
                saved = await self.report_repo.save(report)
                synced.append(saved)
        return synced
