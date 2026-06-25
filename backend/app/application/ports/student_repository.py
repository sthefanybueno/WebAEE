import uuid
from typing import List, Optional, Protocol

from app.domain.models import StatusAluno, Student


class StudentRepository(Protocol):
    """Port de persistência para a entidade Student.

    POLÍTICA DE DOMÍNIO: não existe deleção física de alunos.
    O soft-delete é feito via `student.arquivar(user_id)` + `save()`.
    O Use Case DeleteStudent usa este repositório apenas para fins administrativos
    e deve ser restrito ao papel ADMIN com auditoria obrigatória.
    """

    async def get_by_id(self, id: uuid.UUID, professor_id: Optional[uuid.UUID] = None) -> Optional[Student]:
        ...

    async def list_by_tenant(
        self, tenant_id: Optional[uuid.UUID], status: Optional[StatusAluno] = None, professor_id: Optional[uuid.UUID] = None, escola_id: Optional[uuid.UUID] = None
    ) -> List[Student]:
        ...

    async def save(self, student: Student) -> Student:
        ...

    async def hard_delete(self, id: uuid.UUID) -> None:
        """Deleção física — USO RESTRITO ao papel ADMIN com auditoria obrigatória.

        NUNCA use diretamente; passe pelo DeleteStudentUseCase que verifica
        permissões e grava no audit_log antes de executar.
        """
        ...
