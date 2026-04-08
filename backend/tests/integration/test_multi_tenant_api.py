import uuid

import pytest
from httpx import ASGITransport, AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app.domain.entities.school import School
from app.infrastructure.database import engine, init_db
from app.main import app


from typing import AsyncGenerator

@pytest.fixture(autouse=True)
async def setup_db() -> AsyncGenerator[None, None]:
    await init_db()
    yield
    await engine.dispose()


@pytest.mark.asyncio
async def test_multi_tenant_isolation() -> None:
    tenant_a_id = uuid.uuid4()
    tenant_b_id = uuid.uuid4()
    escola_a_id = uuid.uuid4()
    escola_b_id = uuid.uuid4()

    async with AsyncSession(engine, expire_on_commit=False) as session:
        school_a = School(id=escola_a_id, tenant_id=tenant_a_id, nome="Escola Tenant A")
        school_b = School(id=escola_b_id, tenant_id=tenant_b_id, nome="Escola Tenant B")
        session.add(school_a)
        session.add(school_b)
        await session.commit()

    headers_a = {
        "Authorization": f"Bearer mock_token_{uuid.uuid4()}_{tenant_a_id}_coordenacao"
    }
    headers_b = {
        "Authorization": f"Bearer mock_token_{uuid.uuid4()}_{tenant_b_id}_coordenacao"
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac: # type: ignore[arg-type]
        # Cria aluno no Tenant A
        res_a = await ac.post(
            "/api/alunos/",
            json={
                "nome": "Aluno Tenant A",
                "escola_atual_id": str(escola_a_id),
                "consentimento_lgpd": True,
            },
            headers=headers_a,
        )
        assert res_a.status_code == 201

        # Cria aluno no Tenant B
        res_b = await ac.post(
            "/api/alunos/",
            json={
                "nome": "Aluno Tenant B",
                "escola_atual_id": str(escola_b_id),
                "consentimento_lgpd": True,
            },
            headers=headers_b,
        )
        assert res_b.status_code == 201

        # Tenant A lista alunos
        list_a = await ac.get("/api/alunos/", headers=headers_a)
        data_a = list_a.json()
        assert len(data_a) == 1
        assert data_a[0]["tenant_id"] == str(tenant_a_id)
        assert data_a[0]["nome"] == "Aluno Tenant A"

        # Tenant B tenta listar alunos ("não pode enxergar os do A")
        list_b = await ac.get("/api/alunos/", headers=headers_b)
        data_b = list_b.json()
        assert len(data_b) == 1
        assert data_b[0]["tenant_id"] == str(tenant_b_id)
        assert data_b[0]["nome"] == "Aluno Tenant B"
