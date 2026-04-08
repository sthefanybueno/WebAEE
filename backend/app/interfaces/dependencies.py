import uuid
from dataclasses import dataclass

from fastapi import Header, HTTPException, status, Depends

from app.domain.entities.user import PapelUsuario


@dataclass
class CurrentUser:
    id: uuid.UUID
    tenant_id: uuid.UUID
    papel: PapelUsuario


from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme)
) -> CurrentUser:
    """
    Mock de autenticação compatível com o botão (Authorize) do Swagger (MVP).
    O token esperado é o retornado pelo /api/auth/login ou formato mock manual:
    Formato: "mock_token_{user_id}_{tenant_id}_{papel}"
    """
    try:
        parts = token.split("_")
        if len(parts) >= 5 and parts[0] == "mock" and parts[1] == "token":
            user_id = uuid.UUID(parts[2])
            tenant_id = uuid.UUID(parts[3])
            papel = PapelUsuario("_".join(parts[4:]))
        else:
            # Fallback for old tokens or generic mock testing tokens
            user_id = uuid.uuid4()
            tenant_id = uuid.uuid4()
            papel = PapelUsuario.PROF_AEE
            
    except (ValueError, IndexError):
        raise HTTPException(status_code=401, detail="Token JWT inválido")
        
    return CurrentUser(id=user_id, tenant_id=tenant_id, papel=papel)
