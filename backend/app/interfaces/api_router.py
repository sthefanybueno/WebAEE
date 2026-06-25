"""
Sistema AEE — Registro Centralizado de Routers
================================================
Este módulo é o único ponto onde todos os routers são registrados
no app FastAPI. O main.py importa apenas este módulo.

Benefícios:
  - main.py fica limpo e sem imports espalhados.
  - Testes de integração podem montar sub-routers sem inicializar tudo.
  - Adicionar novos routers requer mudança apenas aqui.
"""

from fastapi import APIRouter, Depends, FastAPI

from app.interfaces.dependencies import get_current_user
from app.interfaces.routers import (
    auth,
    dashboard,
    notifications,
    photos,
    reports,
    schedules,
    schools,
    students,
    sync,
    users,
)

api_router = APIRouter()

# Auth is public
api_router.include_router(auth.router)

# All other routes require authentication
protected_deps = [Depends(get_current_user)]
api_router.include_router(dashboard.router, dependencies=protected_deps)
api_router.include_router(notifications.router, dependencies=protected_deps)
api_router.include_router(photos.router, dependencies=protected_deps)
api_router.include_router(reports.router, dependencies=protected_deps)
api_router.include_router(schools.router, dependencies=protected_deps)
api_router.include_router(students.router, dependencies=protected_deps)
api_router.include_router(sync.router, dependencies=protected_deps)
api_router.include_router(users.router, dependencies=protected_deps)
api_router.include_router(schedules.router, dependencies=protected_deps)

def register_routers(app: FastAPI) -> None:
    """Registra todos os routers da aplicação no app FastAPI."""
    app.include_router(api_router)
