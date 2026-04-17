"""
Testes de integração para accounts (users) e dashboard falhas variadas
"""
import uuid
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app

def auth_headers(papel: str = "coordenacao", user_id: str|None=None, tenant_id: str|None=None) -> dict[str, str]:
    if not user_id:
        user_id = str(uuid.uuid4())
    if not tenant_id:
        tenant_id = str(uuid.uuid4())
    return {"Authorization": f"Bearer mock_token_{user_id}_{tenant_id}_{papel}"}

@pytest.mark.asyncio
async def test_auth_token_invalido() -> None:
    # Cobertura de dependencies.py try/except (ValueError, IndexError)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/dashboard/", headers={"Authorization": "Bearer mock_token_invalid_uuid_prof_aee"})
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_auth_token_velho() -> None:
    # Cobertura de dependencies.py token antigo
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/dashboard/", headers={"Authorization": "Bearer just_a_random_token"})
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_get_me_user_found() -> None:
    tenant_id = str(uuid.uuid4())
    headers = auth_headers("coordenacao", tenant_id=tenant_id)
    # Primeiro criamos o usuário usando POST
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res_post = await ac.post("/api/usuarios/", json={
            "email": f"me_{tenant_id}@edu.br",
            "nome": "My Name",
            "papel": "coordenacao",
            "escola_ids": []
        }, headers=headers)
        assert res_post.status_code == 201
        user_data = res_post.json()
        target_id = user_data["id"]

        # Agora testamos GET /me mas passamos o id apropriado
        me_headers = auth_headers("coordenacao", user_id=target_id, tenant_id=tenant_id)
        res_me = await ac.get("/api/usuarios/me", headers=me_headers)
        assert res_me.status_code == 200
        assert res_me.json()["id"] == target_id

@pytest.mark.asyncio
async def test_get_me_user_not_found() -> None:
    # user_id que nunca foi criado
    random_id = str(uuid.uuid4())
    headers = auth_headers("coordenacao", user_id=random_id)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res_me = await ac.get("/api/usuarios/me", headers=headers)
        assert res_me.status_code == 404
