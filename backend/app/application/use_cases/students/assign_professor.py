from dataclasses import dataclass
import uuid
from app.application.ports.student_repository import StudentRepository
from app.application.ports.professor_assignment_repository import ProfessorAssignmentRepository
from app.domain.entities.professor_assignment import ProfessorAssignment
from app.domain.entities.user import PapelUsuario

@dataclass
class AssignProfessorInput:
    tenant_id: uuid.UUID
    student_id: uuid.UUID
    usuario_id: uuid.UUID
    tipo_papel: PapelUsuario

class AssignProfessorUseCase:
    def __init__(
        self, 
        student_repo: StudentRepository,
        assignment_repo: ProfessorAssignmentRepository
    ):
        self.student_repo = student_repo
        self.assignment_repo = assignment_repo

    async def execute(self, input_dto: AssignProfessorInput) -> ProfessorAssignment:
        student = await self.student_repo.get_by_id(input_dto.student_id)
        
        if not student or student.tenant_id != input_dto.tenant_id:
            raise ValueError("Aluno não encontrado no seu tenant.")
            
        if not student.escola_atual_id:
            raise ValueError("Aluno não está vinculado a nenhuma escola.")

        # Verificar se já existe vinculo ativo
        ativos = await self.assignment_repo.list_by_student(input_dto.student_id)
        for a in ativos:
            if a.usuario_id == input_dto.usuario_id and a.ativo:
                raise ValueError("Este usuário já possui um vínculo ativo com o aluno especificado.")

        assignment = ProfessorAssignment(
            usuario_id=input_dto.usuario_id,
            escola_id=student.escola_atual_id,
            aluno_id=input_dto.student_id,
            tipo_papel=input_dto.tipo_papel
        )
        
        return await self.assignment_repo.save(assignment)
