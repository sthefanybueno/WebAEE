import uuid
from dataclasses import dataclass

from fastapi import Header, HTTPException, status

from app.domain.entities.user import PapelUsuario


@dataclass
class CurrentUser:
    id: uuid.UUID
    tenant_id: uuid.UUID
    papel: PapelUsuario


async def get_current_user(
    x_user_id: str = Header(..., description="Em produção viria do JWT."),
    x_tenant_id: str = Header(..., description="Em produção viria do JWT."),
    x_papel: str = Header("prof_aee", description="Em produção viria do JWT."),
) -> CurrentUser:
    """Mock de autenticação para as fases iniciais do MVP."""
    try:
        user_id = uuid.UUID(x_user_id)
        tenant_id = uuid.UUID(x_tenant_id)
        papel = PapelUsuario(x_papel)
    except ValueError:
        raise HTTPException(status_code=400, detail="Headers inválidos")
    return CurrentUser(id=user_id, tenant_id=tenant_id, papel=papel)
