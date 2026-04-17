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

from sqlmodel.ext.asyncio.session import AsyncSession

class SyncReportUseCase:
    """Caso de uso para sincronização offline-first de relatórios (Resiliência Distribuída).
    
    Este componente gerencia a reconciliação de dados entre o estado local do PWA e a 
    base centralizada. A estratégia de concorrência baseia-se em timestamps UTC 
    (Last-Write-Wins), mitigando condições de corrida em edições multi-dispositivo.
    
    Regras de Negócio:
    - Se o timestamp local (`updated_at_local`) for superior ao do servidor, o estado 
      do servidor é sobrescrito.
    - Se houver divergência retroativa (timestamp servidor > local), um flag de 
      conflito (`conflict_flag`) é ativado para resolução manual na UI.
    - Atomidade: Toda a lista de sincronização é processada em uma única transação SQL.
    """
    def __init__(
        self, 
        session: AsyncSession,
        report_repo: ReportRepository, 
        student_repo: StudentRepository
    ):
        self.session = session
        self.report_repo = report_repo
        self.student_repo = student_repo

    async def execute(self, inputs: List[SyncReportInput]) -> List[Report]:
        """Sincroniza uma lista de relatórios vindos do cliente sob uma transação atômica.
        """
        async with self.session.begin():
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
