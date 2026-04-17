"""
Testes unitários para CreatePhotoUseCase e SyncPhotoUseCase.
"""
import uuid
import pytest

from app.application.use_cases.photos.create_photo import CreatePhotoUseCase, CreatePhotoInput
from app.application.use_cases.photos.sync_photo import SyncPhotoUseCase, SyncPhotoInput
from app.domain.entities.photo import Photo
from app.domain.models import TagPedagogica, SyncStatus, Student

class MockAsyncSession:
    def begin(self): return self
    async def __aenter__(self): return self
    async def __aexit__(self, t, v, tb): pass



class MockPhotoRepository:
    def __init__(self, existing_photo: Photo | None = None):
        self.photos: dict[uuid.UUID, Photo] = {}
        if existing_photo:
            self.photos[existing_photo.id] = existing_photo

    async def get_by_id(self, id: uuid.UUID) -> Photo | None:
        return self.photos.get(id)

    async def save(self, photo: Photo) -> Photo:
        self.photos[photo.id] = photo
        return photo


class MockStudentRepository:
    def __init__(self, student: Student | None = None):
        self.student = student

    async def get_by_id(self, id: uuid.UUID) -> Student | None:
        return self.student


@pytest.mark.asyncio
async def test_create_photo_student_not_found() -> None:
    photo_repo = MockPhotoRepository()
    student_repo = MockStudentRepository(student=None)
    use_case = CreatePhotoUseCase(session=MockAsyncSession(), photo_repo=photo_repo, student_repo=student_repo)

    inp = CreatePhotoInput(
        aluno_id=uuid.uuid4(),
        autor_id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        foto_url="http://example.com/p.jpg",
        tag=TagPedagogica.MOTOR_FINO
    )
    with pytest.raises(ValueError, match="não encontrado"):
        await use_case.execute(inp)


@pytest.mark.asyncio
async def test_create_photo_success() -> None:
    tenant_id = uuid.uuid4()
    aluno_id = uuid.uuid4()
    student = Student(id=aluno_id, tenant_id=tenant_id, nome="Aluno")
    photo_repo = MockPhotoRepository()
    student_repo = MockStudentRepository(student=student)
    use_case = CreatePhotoUseCase(session=MockAsyncSession(), photo_repo=photo_repo, student_repo=student_repo)

    inp = CreatePhotoInput(
        aluno_id=aluno_id,
        autor_id=uuid.uuid4(),
        tenant_id=tenant_id,
        foto_url="http://example.com/p.jpg",
        tag=TagPedagogica.MOTOR_FINO
    )
    photo = await use_case.execute(inp)
    assert photo.url == "http://example.com/p.jpg"
    assert photo.tag == TagPedagogica.MOTOR_FINO


@pytest.mark.asyncio
async def test_sync_photo_skip_invalid_student() -> None:
    tenant_id = uuid.uuid4()
    student = Student(id=uuid.uuid4(), tenant_id=uuid.uuid4(), nome="Aluno") # Different tenant
    photo_repo = MockPhotoRepository()
    student_repo = MockStudentRepository(student=student)
    use_case = SyncPhotoUseCase(session=MockAsyncSession(), photo_repo=photo_repo, student_repo=student_repo)

    inp = SyncPhotoInput(
        id=uuid.uuid4(),
        aluno_id=student.id,
        autor_id=uuid.uuid4(),
        tenant_id=tenant_id,
        foto_url="url",
        tag=TagPedagogica.MOTOR_FINO,
        sync_status=SyncStatus.SYNCED
    )
    res = await use_case.execute([inp])
    assert len(res) == 0


@pytest.mark.asyncio
async def test_sync_photo_skip_existing() -> None:
    tenant_id = uuid.uuid4()
    aluno_id = uuid.uuid4()
    photo_id = uuid.uuid4()
    student = Student(id=aluno_id, tenant_id=tenant_id, nome="Aluno")
    existing = Photo(id=photo_id, aluno_id=aluno_id, autor_id=uuid.uuid4(), url="url", tag=TagPedagogica.MOTOR_FINO)
    photo_repo = MockPhotoRepository(existing_photo=existing)
    student_repo = MockStudentRepository(student=student)
    use_case = SyncPhotoUseCase(session=MockAsyncSession(), photo_repo=photo_repo, student_repo=student_repo)

    inp = SyncPhotoInput(
        id=photo_id,
        aluno_id=aluno_id,
        autor_id=uuid.uuid4(),
        tenant_id=tenant_id,
        foto_url="url_new",
        tag=TagPedagogica.SOCIALIZACAO,
        sync_status=SyncStatus.SYNCED
    )
    res = await use_case.execute([inp])
    assert len(res) == 0


@pytest.mark.asyncio
async def test_sync_photo_success() -> None:
    tenant_id = uuid.uuid4()
    aluno_id = uuid.uuid4()
    student = Student(id=aluno_id, tenant_id=tenant_id, nome="Aluno")
    photo_repo = MockPhotoRepository()
    student_repo = MockStudentRepository(student=student)
    use_case = SyncPhotoUseCase(session=MockAsyncSession(), photo_repo=photo_repo, student_repo=student_repo)

    inp = SyncPhotoInput(
        id=uuid.uuid4(),
        aluno_id=aluno_id,
        autor_id=uuid.uuid4(),
        tenant_id=tenant_id,
        foto_url="url_new",
        tag=TagPedagogica.OUTRO,
        sync_status=SyncStatus.SYNCED
    )
    res = await use_case.execute([inp])
    assert len(res) == 1
    assert res[0].url == "url_new"
