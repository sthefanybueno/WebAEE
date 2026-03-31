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


class CreatePhotoUseCase:
    def __init__(
        self, photo_repo: PhotoRepository, student_repo: StudentRepository
    ) -> None:
        self.photo_repo = photo_repo
        self.student_repo = student_repo

    async def execute(self, input_dto: CreatePhotoInput) -> Photo:
        student = await self.student_repo.get_by_id(input_dto.aluno_id)
        if not student or student.tenant_id != input_dto.tenant_id:
            raise ValueError("Aluno não encontrado ou não pertence a este tenant.")

        photo = Photo(
            aluno_id=input_dto.aluno_id,
            autor_id=input_dto.autor_id,
            foto_url=input_dto.foto_url,
            tag=input_dto.tag,
        )
        return await self.photo_repo.save(photo)
