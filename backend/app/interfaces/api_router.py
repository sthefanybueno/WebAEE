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

from fastapi import FastAPI

from app.interfaces.routers import (
    auth,
    dashboard,
    photos,
    reports,
    schools,
    students,
    sync,
    users,
)


def register_routers(app: FastAPI) -> None:
    """Registra todos os routers da aplicação no app FastAPI."""
    app.include_router(auth.router)
    app.include_router(students.router)
    app.include_router(schools.router)
    app.include_router(photos.router)
    app.include_router(reports.router)
    app.include_router(users.router)
    app.include_router(dashboard.router)
    app.include_router(sync.router)
