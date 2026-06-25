import os
import uuid
from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt

# Em produção, essa chave deve vir de variável de ambiente (ex: pydantic-settings)
# Estamos hardcoding um fallback por enquanto para manter o sistema rodando simples
SECRET_KEY = os.getenv("SECRET_KEY", "b40a5a3b75f85e463a8d169c944ebba99e910ef88f1dc51d4576318e806ef664")
ALGORITHM = "HS256"
INVITE_TOKEN_EXPIRE_HOURS = 48
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("JWT_TTL_HOURS", "8"))

def create_access_token(user_id: uuid.UUID, tenant_id: uuid.UUID, papel: str, nome: str) -> str:
    """Cria um JWT para sessão de usuário (login)."""
    expire = datetime.now(UTC) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode = {
        "sub": str(user_id),
        "tenant_id": str(tenant_id),
        "papel": papel,
        "nome": nome,
        "type": "access",
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict | None:
    """Decodifica um JWT de acesso e retorna o payload completo.
    Retorna None se o token for inválido, expirado ou não for de acesso."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        token_type = payload.get("type")
        if token_type != "access":
            return None
            
        user_id_str = payload.get("sub")
        if user_id_str is None:
            return None
            
        return payload
    except (JWTError, ValueError):
        return None


def create_invite_token(user_id: uuid.UUID) -> str:
    """Cria um JWT para convite de usuário."""
    expire = datetime.now(UTC) + timedelta(hours=INVITE_TOKEN_EXPIRE_HOURS)
    to_encode = {
        "sub": str(user_id),
        "type": "invite",
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_invite_token(token: str) -> uuid.UUID | None:
    """Decodifica um JWT de convite de usuário e retorna o user_id. 
    Retorna None se o token for inválido, expirado ou não for de convite."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        token_type = payload.get("type")
        if token_type != "invite":
            return None
        
        user_id_str = payload.get("sub")
        if user_id_str is None:
            return None
            
        return uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        return None
