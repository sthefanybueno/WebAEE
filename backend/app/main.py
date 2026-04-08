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

from app.interfaces.routers import students, schools, photos, reports, auth, users, dashboard, sync

app.include_router(students.router)
app.include_router(schools.router)
app.include_router(photos.router)
app.include_router(reports.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(sync.router)


@app.get("/health", tags=["infra"])
async def health_check() -> dict[str, str]:
    """Health check — confirma que a API está no ar."""
    return {"status": "ok", "service": "aee-api"}
