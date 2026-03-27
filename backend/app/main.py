"""
Sistema AEE — Entry point FastAPI
==================================
Stub mínimo para `docker compose up api` iniciar sem erro.
As rotas serão adicionadas gradualmente a partir da Fase 3.
"""

from fastapi import FastAPI

app = FastAPI(
    title="Sistema AEE",
    description="API de Gestão do Atendimento Educacional Especializado",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


@app.get("/health", tags=["infra"])
async def health_check() -> dict[str, str]:
    """Health check — confirma que a API está no ar."""
    return {"status": "ok", "service": "aee-api"}
