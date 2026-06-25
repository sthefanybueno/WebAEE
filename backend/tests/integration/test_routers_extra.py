"""
Testes de integração para routers: auth, users, schools, dashboard.
Cobre as rotas com menor cobertura identificadas no relatório de cobertura.
"""
import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.infrastructure.security.tokens import create_access_token
from app.main import app


def auth_headers(papel: str = "coordenacao", user_id: str|None=None, tenant_id: str|None=None) -> dict[str, str]:
    if not user_id:
        user_id = str(uuid.uuid4())
    if not tenant_id:
        tenant_id = str(uuid.uuid4())
    token = create_access_token(user_id, tenant_id, papel, "Test User")
    return {"Authorization": f"Bearer {token}"}



# ──────────────────────────────────────────────
# Auth router
# ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_com_papel_valido() -> None:
    # First create user
    tenant_id = uuid.uuid4()
    headers = auth_headers("coordenacao", tenant_id=str(tenant_id))
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:  # type: ignore[arg-type]
        await ac.post(
            "/api/usuarios/",
            json={"email": "prof@escola.edu.br", "nome": "Prof", "papel": "prof_aee", "password": "validpassword"},
            headers=headers
        )
        res = await ac.post(
            "/api/auth/login",
            data={"username": "prof@escola.edu.br", "password": "validpassword"},
        )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["papel"] == "prof_aee"


@pytest.mark.asyncio
async def test_login_invalido() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:  # type: ignore[arg-type]
        res = await ac.post(
            "/api/auth/login",
            data={"username": "x@y.com", "password": "papel_inexistente"},
        )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_valido() -> None:
    valid_token = create_access_token(uuid.uuid4(), uuid.uuid4(), "coordenacao", "Test User")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:  # type: ignore[arg-type]
        res = await ac.post("/api/auth/refresh", json={"refresh_token": valid_token})
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
    assert "items" in res.json()
    assert isinstance(res.json()["items"], list)

@pytest.mark.asyncio
async def test_get_user_alunos() -> None:
    headers = auth_headers("coordenacao")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:  # type: ignore[arg-type]
        res = await ac.get(f"/api/usuarios/{uuid.uuid4()}/alunos", headers=headers)
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
