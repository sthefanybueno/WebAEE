import uuid

import pytest

from app.application.use_cases.students.archive_student import (
    ArchiveStudentInput,
    ArchiveStudentUseCase,
)
from app.domain.entities.audit_log import AuditLog
from app.domain.models import StatusAluno, Student


class MockStudentRepository:
    def __init__(self) -> None:
        self.saved_students: dict[uuid.UUID, Student] = {}

    async def get_by_id(self, id: uuid.UUID) -> Student | None:
        return self.saved_students.get(id)

    async def save(self, student: Student) -> Student:
        self.saved_students[student.id] = student
        return student


class MockAuditLogRepository:
    def __init__(self) -> None:
        self.logs: list[AuditLog] = []

    async def save(self, audit_log: AuditLog) -> AuditLog:
        self.logs.append(audit_log)
        return audit_log


@pytest.fixture
def repo_student() -> MockStudentRepository:
    return MockStudentRepository()


@pytest.fixture
def repo_audit() -> MockAuditLogRepository:
    return MockAuditLogRepository()


@pytest.mark.asyncio
async def test_archive_student_success(
    repo_student: MockStudentRepository, repo_audit: MockAuditLogRepository
) -> None:
    student_id = uuid.uuid4()
    tenant_id = uuid.uuid4()
    user_id = uuid.uuid4()

    student = Student(
        id=student_id,
        nome="José",
        tenant_id=tenant_id,
        consentimento_lgpd=True,
    )
    repo_student.saved_students[student_id] = student

    use_case = ArchiveStudentUseCase(student_repo=repo_student, audit_repo=repo_audit)
    input_dto = ArchiveStudentInput(
        student_id=student_id,
        tenant_id=tenant_id,
        user_id=user_id,
    )

    updated_student = await use_case.execute(input_dto)

    assert updated_student.status == StatusAluno.ARQUIVADO
    assert updated_student.updated_by == user_id

    assert len(repo_audit.logs) == 1
    assert repo_audit.logs[0].student_id == student_id
    assert repo_audit.logs[0].user_id == user_id
    assert repo_audit.logs[0].field_accessed == "status (arquivamento)"


@pytest.mark.asyncio
async def test_archive_student_not_found(
    repo_student: MockStudentRepository, repo_audit: MockAuditLogRepository
) -> None:
    use_case = ArchiveStudentUseCase(student_repo=repo_student, audit_repo=repo_audit)
    input_dto = ArchiveStudentInput(
        student_id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
    )
    with pytest.raises(
        ValueError, match="Aluno não encontrado ou não pertence a este tenant."
    ):
        await use_case.execute(input_dto)
