import uuid

import pytest
from httpx import ASGITransport, AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app.domain.entities.school import School
from app.infrastructure.database import engine, init_db
from app.main import app


@pytest.fixture(autouse=True)
async def setup_db() -> None:
    await init_db()


@pytest.mark.asyncio
async def test_create_and_list_student_api() -> None:
    tenant_id = uuid.uuid4()
    escola_id = uuid.uuid4()
    user_id = uuid.uuid4()

    # Preparando o banco de dados com uma Escola válida
    async with AsyncSession(engine, expire_on_commit=False) as session:
        school = School(id=escola_id, tenant_id=tenant_id, nome="Escola Esperança")
        session.add(school)
        await session.commit()

    headers = {
        "x-user-id": str(user_id),
        "x-tenant-id": str(tenant_id),
        "x-papel": "prof_aee",
    }

    payload = {
        "nome": "Maria da Silva",
        "escola_atual_id": str(escola_id),
        "consentimento_lgpd": True,
        "diagnostico": "TDAH",  # Simula envio, a API deverá ocultar na resposta
    }

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test" # type: ignore[arg-type]
    ) as ac:
        # Create
        response = await ac.post("/api/alunos/", json=payload, headers=headers)
        assert response.status_code == 201
        data = response.json()
        student_id = data["id"]
        assert data["nome"] == "Maria da Silva"
        assert "diagnostico" not in data  # LGPD Leak check

        # List
        list_response = await ac.get("/api/alunos/", headers=headers)
        assert list_response.status_code == 200
        list_data = list_response.json()
        assert len(list_data) == 1
        assert list_data[0]["id"] == student_id
        assert "diagnostico" not in list_data[0]

        # Archive
        archive_res = await ac.post(f"/api/alunos/{student_id}/arquivar", headers=headers)
        assert archive_res.status_code == 200
        assert archive_res.json()["status"] == "arquivado"

        # Sensitive data check without justification (should fail if we had it as path/query, but it's a query param)
        sens_res = await ac.get(f"/api/alunos/{student_id}/dados-sensiveis", headers=headers)
        assert sens_res.status_code == 422 # missing justificativa

        # Sensitive data check with too short justification
        sens_res2 = await ac.get(f"/api/alunos/{student_id}/dados-sensiveis?justificativa=curta", headers=headers)
        assert sens_res2.status_code == 400

        # Sensitive data check with correct justification
        sens_res3 = await ac.get(f"/api/alunos/{student_id}/dados-sensiveis?justificativa=Necessidade%20Medica%20Urgente", headers=headers)
        assert sens_res3.status_code == 200
        assert sens_res3.json()["diagnostico"] == "TDAH"
