import uuid
from dataclasses import dataclass
from typing import List

from app.application.ports.photo_repository import PhotoRepository
from app.application.ports.student_repository import StudentRepository
from app.domain.entities.photo import Photo
from app.domain.models import SyncStatus, TagPedagogica


@dataclass
class SyncPhotoInput:
    id: uuid.UUID
    aluno_id: uuid.UUID
    autor_id: uuid.UUID
    tenant_id: uuid.UUID
    foto_url: str
    tag: TagPedagogica
    sync_status: SyncStatus


from sqlmodel.ext.asyncio.session import AsyncSession

class SyncPhotoUseCase:
    """Caso de uso para sincronizar fotos enviadas via PWA offline"""

    def __init__(
        self, 
        session: AsyncSession,
        photo_repo: PhotoRepository, 
        student_repo: StudentRepository
    ) -> None:
        self.session = session
        self.photo_repo = photo_repo
        self.student_repo = student_repo

    async def execute(self, inputs: List[SyncPhotoInput]) -> List[Photo]:
        synced_photos = []
        async with self.session.begin():
            for input_dto in inputs:
                student = await self.student_repo.get_by_id(input_dto.aluno_id)
                if not student or student.tenant_id != input_dto.tenant_id:
                    # Se não pertencer, ignoramos essa foto no sync (ou logamos erro)
                    continue

                existing_photo = await self.photo_repo.get_by_id(input_dto.id)
                if existing_photo:
                    # Pula ou Atualiza se já existe
                    continue

                photo = Photo(
                    id=input_dto.id,
                    aluno_id=input_dto.aluno_id,
                    autor_id=input_dto.autor_id,
                    url=input_dto.foto_url,
                    tag=input_dto.tag,
                    sync_status=SyncStatus.SYNCED,
                )
                saved = await self.photo_repo.save(photo)
                synced_photos.append(saved)

        return synced_photos
