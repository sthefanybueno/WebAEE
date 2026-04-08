import uuid
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, HTTPException, status, Depends
from app.interfaces.schemas.auth import LoginRequest, LoginResponse, TokenRefreshRequest, TokenRefreshResponse
from app.domain.entities.user import PapelUsuario

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=LoginResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    **🔑 Login de desenvolvimento (Mock)**

    - **Username**: qualquer e-mail
    - **Password**: digite o **papel** desejado:
      - `coordenacao` → acesso total (cria usuários, vê tudo)
      - `prof_aee` → cria e edita relatórios
      - `prof_apoio` → acompanha alunos
      - `prof_regente` → somente leitura
      - qualquer outra coisa → usa `coordenacao` por padrão
    """
    # Tenta usar o password como papel, fallback para coordenacao
    try:
        papel = PapelUsuario(form_data.password.strip().lower())
    except ValueError:
        papel = PapelUsuario.COORDENACAO  # padrão mais permissivo para dev

    user_id = uuid.uuid4()
    tenant_id = uuid.uuid4()

    return LoginResponse(
        access_token=f"mock_token_{user_id}_{tenant_id}_{papel.value}",
        user_id=user_id,
        tenant_id=tenant_id,
        papel=papel
    )

@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(request: TokenRefreshRequest):
    """
    Simula o rotacionamento silencioso do JWT token.
    PWA utiliza essa rota intermitentemente para evitar o logout silencioso.
    """
    if not request.refresh_token.startswith("mock_"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido"
        )
    
    return TokenRefreshResponse(
        access_token=f"mock_refreshed_token_{uuid.uuid4()}",
    )
