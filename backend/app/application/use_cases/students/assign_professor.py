from dataclasses import dataclass
import uuid
from app.application.ports.student_repository import StudentRepository
from app.application.ports.professor_assignment_repository import ProfessorAssignmentRepository
from app.domain.entities.professor_assignment import ProfessorAssignment
from app.domain.entities.user import PapelUsuario
from app.domain.exceptions import AlunoNaoEncontradoError, AlunoSemEscolaError, VinculoDuplicadoError

@dataclass
class AssignProfessorInput:
    tenant_id: uuid.UUID
    student_id: uuid.UUID
    usuario_id: uuid.UUID
    tipo_papel: PapelUsuario

from sqlmodel.ext.asyncio.session import AsyncSession

class AssignProfessorUseCase:
    """Caso de uso para vincular professores ou profissionais de apoio a um aluno.
    
    O vínculo é escola-específico: ao ser criado, o vínculo herda a 
    escola atual do aluno. Se o aluno for transferido, os vínculos 
    ativos devem ser revogados (ver TransferStudentUseCase).
    """
    def __init__(
        self, 
        session: AsyncSession,
        student_repo: StudentRepository,
        assignment_repo: ProfessorAssignmentRepository
    ):
        self.session = session
        self.student_repo = student_repo
        self.assignment_repo = assignment_repo

    async def execute(self, input_dto: AssignProfessorInput) -> ProfessorAssignment:
        """Cria um novo vínculo docente para um aluno dentro de uma transação.
        """
        async with self.session.begin():
            student = await self.student_repo.get_by_id(input_dto.student_id)
            
            if not student or student.tenant_id != input_dto.tenant_id:
                raise AlunoNaoEncontradoError(input_dto.student_id)
                
            if not student.escola_atual_id:
                raise AlunoSemEscolaError()

            # Verificar se já existe vinculo ativo
            ativos = await self.assignment_repo.list_active_by_student(input_dto.student_id)
            for a in ativos:
                if a.usuario_id == input_dto.usuario_id and a.ativo:
                    raise VinculoDuplicadoError()

            assignment = ProfessorAssignment(
                usuario_id=input_dto.usuario_id,
                escola_id=student.escola_atual_id,
                aluno_id=input_dto.student_id,
                tipo_papel=input_dto.tipo_papel
            )
            
            return await self.assignment_repo.save(assignment)
