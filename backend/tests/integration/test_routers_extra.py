"""
Testes de integração para routers: auth, users, schools, dashboard.
Cobre as rotas com menor cobertura identificadas no relatório de cobertura.
"""
import uuid
import pytest
from typing import AsyncGenerator
from httpx import ASGITransport, AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app.infrastructure.database import engine, init_db
from app.main import app




def auth_headers(papel: str = "coordenacao") -> dict[str, str]:
    user_id = uuid.uuid4()
    tenant_id = uuid.uuid4()
    return {"Authorization": f"Bearer mock_token_{user_id}_{tenant_id}_{papel}"}


# ──────────────────────────────────────────────
# Auth router
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_com_papel_valido() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:  # type: ignore[arg-type]
        res = await ac.post(
            "/api/auth/login",
            data={"username": "prof@escola.edu.br", "password": "prof_aee"},
        )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["papel"] == "prof_aee"


@pytest.mark.asyncio
async def test_login_papel_invalido_usa_coordenacao() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:  # type: ignore[arg-type]
        res = await ac.post(
            "/api/auth/login",
            data={"username": "x@y.com", "password": "papel_inexistente"},
        )
    assert res.status_code == 200
    assert res.json()["papel"] == "coordenacao"


@pytest.mark.asyncio
async def test_refresh_token_valido() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:  # type: ignore[arg-type]
        res = await ac.post("/api/auth/refresh", json={"refresh_token": "mock_valid_token"})
    assert res.status_code == 200
    assert "access_token" in res.json()


@pytest.mark.asyncio
async def test_refresh_token_invalido() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:  # type: ignore[arg-type]
        res = await ac.post("/api/auth/refresh", json={"refresh_token": "token_invalido"})
    assert res.status_code == 401


# ──────────────────────────────────────────────
# Schools router
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_and_list_school() -> None:
    headers = auth_headers("coordenacao")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:  # type: ignore[arg-type]
        res = await ac.post("/api/escolas/", json={"nome": "EM Central"}, headers=headers)
        assert res.status_code == 201
        data = res.json()
        assert data["nome"] == "EM Central"
        assert "id" in data

        list_res = await ac.get("/api/escolas/", headers=headers)
        assert list_res.status_code == 200
        schools = list_res.json()
        assert any(s["nome"] == "EM Central" for s in schools)


# ──────────────────────────────────────────────
# Users router
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_user_campos_obrigatorios() -> None:
    """Garante que o router valida campos obrigatórios (422)."""
    headers = auth_headers("coordenacao")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:  # type: ignore[arg-type]
        res = await ac.post("/api/usuarios/", json={}, headers=headers)
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_create_user_papel_invalido() -> None:
    """Garante que o router rejeita papel inválido (422)."""
    headers = auth_headers("coordenacao")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:  # type: ignore[arg-type]
        res = await ac.post(
            "/api/usuarios/",
            json={"email": "x@x.com", "nome": "X", "papel": "papel_inexistente", "escola_ids": []},
            headers=headers,
        )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_list_users() -> None:
    headers = auth_headers("coordenacao")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:  # type: ignore[arg-type]
        res = await ac.get("/api/usuarios/", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


# ──────────────────────────────────────────────
# Dashboard router
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_dashboard_retorna_metricas() -> None:
    headers = auth_headers("coordenacao")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:  # type: ignore[arg-type]
        res = await ac.get("/api/dashboard/", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_alunos_ativos" in data
    assert "total_relatorios_pendentes" in data
    assert "total_fotos_hoje" in data
