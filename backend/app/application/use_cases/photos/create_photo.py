import uuid
from dataclasses import dataclass

from app.application.ports.photo_repository import PhotoRepository
from app.application.ports.student_repository import StudentRepository
from app.domain.entities.photo import Photo
from app.domain.models import TagPedagogica


@dataclass
class CreatePhotoInput:
    tenant_id: uuid.UUID
    aluno_id: uuid.UUID
    autor_id: uuid.UUID
    foto_url: str
    tag: TagPedagogica


from sqlmodel.ext.asyncio.session import AsyncSession

class CreatePhotoUseCase:
    """Caso de uso para registro de fotos pedagógicas.
    
    Permite anexar evidências visuais do desenvolvimento do aluno, 
    associando uma tag pedagógica (ex: AUTONOMIA, COMUNICACAO) para 
    facilitar a filtragem no dashboard e nos relatórios.
    """
    def __init__(
        self, 
        session: AsyncSession,
        photo_repo: PhotoRepository, 
        student_repo: StudentRepository
    ) -> None:
        self.session = session
        self.photo_repo = photo_repo
        self.student_repo = student_repo

    async def execute(self, input_dto: CreatePhotoInput) -> Photo:
        """Registra uma nova foto pedagógica para um aluno dentro de uma transação.
        """
        async with self.session.begin():
            student = await self.student_repo.get_by_id(input_dto.aluno_id)
            if not student or student.tenant_id != input_dto.tenant_id:
                raise ValueError("Aluno não encontrado ou não pertence a este tenant.")

            photo = Photo(
                aluno_id=input_dto.aluno_id,
                autor_id=input_dto.autor_id,
                url=input_dto.foto_url,
                tag=input_dto.tag,
            )
            return await self.photo_repo.save(photo)
