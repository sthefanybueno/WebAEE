"""
Sistema AEE — Entry Point FastAPI
===================================
Responsabilidades deste arquivo:
  1. Instanciar o app FastAPI com metadados.
  2. Configurar middlewares (rate limiting).
  3. Delegar o registro de routers ao api_router.py.
  4. Expor o health check de infraestrutura.

O que NÃO está aqui: imports de routers individuais.
Toda a composição de rotas fica em app/interfaces/api_router.py.
"""

import os
from contextlib import asynccontextmanager

import cloudinary
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.infrastructure.database import init_db
from app.infrastructure.rate_limit import limiter
from app.interfaces.api_router import register_routers


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializa o banco de dados na subida do servidor."""
    await init_db()
    yield


app = FastAPI(
    title="Sistema AEE",
    description="API de Gestão do Atendimento Educacional Especializado",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middlewares ────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore
app.add_middleware(SlowAPIMiddleware)

# ── Routers ────────────────────────────────────────────────────────────────
register_routers(app)

# ── Cloudinary ─────────────────────────────────────────────────────────────
cloudinary_url = os.getenv("CLOUDINARY_URL")
if cloudinary_url:
    cloudinary.config()
    print("Cloudinary configured.")
else:
    print("WARNING: CLOUDINARY_URL not set in environment.")

# ── Infra ──────────────────────────────────────────────────────────────────
@app.get("/health", tags=["infra"])
async def health_check() -> dict[str, str]:
    """Health check — confirma que a API está no ar."""
    return {"status": "ok", "service": "aee-api"}
