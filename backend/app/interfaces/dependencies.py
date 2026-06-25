import uuid
from dataclasses import dataclass

from fastapi import Depends, HTTPException

from app.domain.entities.user import PapelUsuario


@dataclass
class CurrentUser:
    id: uuid.UUID
    tenant_id: uuid.UUID
    papel: PapelUsuario


from fastapi.security import OAuth2PasswordBearer

from app.infrastructure.security.tokens import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme)
) -> CurrentUser:
    """
    Decodifica e valida o JWT real emitido em /api/auth/login
    para recuperar o usuário autenticado.
    """
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token JWT inválido ou expirado")
        
    try:
        user_id = uuid.UUID(payload["sub"])
        tenant_id = uuid.UUID(payload["tenant_id"])
        papel = PapelUsuario(payload["papel"])
    except (ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Token JWT malformado")
        
    return CurrentUser(id=user_id, tenant_id=tenant_id, papel=papel)
