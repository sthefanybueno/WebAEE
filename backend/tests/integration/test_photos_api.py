"""
Testes de integração para router de photos.
"""
import uuid
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.infrastructure.database import init_db, engine


def auth_headers(papel: str = "coordenacao", tenant_id: str|None=None) -> dict[str, str]:
    user_id = uuid.uuid4()
    if not tenant_id:
        tenant_id = uuid.uuid4()
    return {"Authorization": f"Bearer mock_token_{user_id}_{tenant_id}_{papel}"}

@pytest.mark.asyncio
async def test_photos_api_flow() -> None:
    tenant_id = str(uuid.uuid4())
    headers = auth_headers(tenant_id=tenant_id)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        school_res = await ac.post("/api/escolas/", json={"nome": "Photo School"}, headers=headers)
        escola_id = school_res.json()["id"]

        # Create student via API
        student_res = await ac.post("/api/alunos/", json={
            "nome": "Photo Student",
            "escola_atual_id": escola_id,
            "consentimento_lgpd": True
        }, headers=headers)
        student_id = student_res.json()["id"]

        # Create photo
        photo_res = await ac.post("/api/fotos/", json={
            "aluno_id": student_id,
            "url": "http://img.io",
            "tag": "motor_fino"
        }, headers=headers)
        assert photo_res.status_code == 201
        photo_data = photo_res.json()
        assert photo_data["url"] == "http://img.io"
        photo_id = photo_data["id"]

        # List photos specific to student
        list_res = await ac.get(f"/api/fotos/aluno/{student_id}", headers=headers)
        assert list_res.status_code == 200
        assert len(list_res.json()) >= 1

        # Error cases
        bad_student = str(uuid.uuid4())
        bad_list_res = await ac.get(f"/api/fotos/aluno/{bad_student}", headers=headers)
        assert bad_list_res.status_code == 404

        bad_create_res = await ac.post("/api/fotos/", json={
            "aluno_id": bad_student, "url": "x", "tag": "outro"
        }, headers=headers)
        assert bad_create_res.status_code == 400

        # Sync photo error fallback (400 validation for bad student)
        sync_res = await ac.post("/api/fotos/sync", json={
            "items": [
                {
                    "id": str(uuid.uuid4()),
                    "aluno_id": bad_student,
                    "url": "abc",
                    "tag": "outro",
                    "sync_status": "synced"
                }
            ]
        }, headers=headers)
        # Should gracefully return empty or successfully process valid
        assert sync_res.status_code == 200
        assert len(sync_res.json()) == 0

        sync_success = await ac.post("/api/fotos/sync", json={
            "items": [
                {
                    "id": str(uuid.uuid4()),
                    "aluno_id": student_id,
                    "url": "xyz",
                    "tag": "socializacao",
                    "sync_status": "synced"
                }
            ]
        }, headers=headers)
        assert sync_success.status_code == 200
        assert len(sync_success.json()) == 1

