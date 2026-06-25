import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel.ext.asyncio.session import AsyncSession

from app.infrastructure.database import get_session
from app.infrastructure.rate_limit import limiter
from app.infrastructure.security.tokens import create_access_token, decode_access_token
from app.interfaces.schemas.auth import (
    LoginResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def login(
    request: Request, 
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session)
):
    """
    **🔑 Login com Banco de Dados**
    """
    from app.infrastructure.repositories.user_repository_impl import SQLModelUserRepository
    from app.infrastructure.security.passwords import verify_password
    
    repo = SQLModelUserRepository(session)
    user = await repo.get_by_email(form_data.username.strip().lower())
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )

    # Substituindo mock pelo JWT real integrado ao Postgres
    access_token = create_access_token(
        user_id=user.id,
        tenant_id=user.tenant_id,
        papel=user.papel.value,
        nome=user.nome
    )

    return LoginResponse(
        access_token=access_token,
        user_id=user.id,
        tenant_id=user.tenant_id,
        papel=user.papel
    )

@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(request: TokenRefreshRequest):
    """
    Simula o rotacionamento silencioso do JWT token.
    PWA utiliza essa rota intermitentemente para evitar o logout silencioso.
    """
    # Decodifica o token antigo para extrair os dados e gerar um novo
    payload = decode_access_token(request.refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido ou expirado"
        )
    
    # Gera o novo JWT real mantendo os dados da sessão original
    new_access_token = create_access_token(
        user_id=uuid.UUID(payload["sub"]),
        tenant_id=uuid.UUID(payload["tenant_id"]),
        papel=payload["papel"],
        nome=payload.get("nome", "Usuário")
    )
    
    return TokenRefreshResponse(
        access_token=new_access_token,
    )
