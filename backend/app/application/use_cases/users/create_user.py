from dataclasses import dataclass
import uuid
from app.application.ports.user_repository import UserRepository
from app.domain.entities.user import User, PapelUsuario

@dataclass
class CreateUserInput:
    tenant_id: uuid.UUID
    executor_papel: PapelUsuario
    email: str
    nome: str
    papel: PapelUsuario

class CreateUserUseCase:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def execute(self, input_dto: CreateUserInput) -> User:
        # Regras de criação por papel (RBAC):
        # ADMIN      → pode criar qualquer papel
        # COORDENACAO → pode criar coordenacao, prof_aee, prof_apoio, prof_regente
        # PROF_AEE   → só pode criar prof_apoio
        # outros     → não podem criar ninguém

        if input_dto.papel == PapelUsuario.ADMIN and input_dto.executor_papel != PapelUsuario.ADMIN:
            raise ValueError("Apenas Admin pode criar outro Admin.")

        if input_dto.executor_papel == PapelUsuario.PROF_AEE and input_dto.papel != PapelUsuario.PROF_APOIO:
            raise ValueError("Prof. AEE só tem permissão para cadastrar Profissional de Apoio.")

        if input_dto.executor_papel not in (PapelUsuario.ADMIN, PapelUsuario.COORDENACAO, PapelUsuario.PROF_AEE):
            raise ValueError("Você não tem permissão para cadastrar usuários.")
            
        # Verifica duplicidade
        existing_user = await self.user_repo.get_by_email(input_dto.email)
        if existing_user:
            raise ValueError("E-mail já está em uso por outro usuário.")

        user = User(
            tenant_id=input_dto.tenant_id,
            email=input_dto.email,
            senha_hash="senha_temporaria_hash_simulada", # Em produção, bcrypt+salt
            nome=input_dto.nome,
            papel=input_dto.papel,
            ativo=True
        )
        return await self.user_repo.save(user)
