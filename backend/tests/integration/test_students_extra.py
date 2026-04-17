"""
Testes de integração extras para students.
"""
import uuid
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.infrastructure.database import init_db, engine


def auth_headers(papel: str = "coordenacao", tenant_id: str|None=None, user_id: str|None=None) -> dict[str, str]:
    if not user_id:
        user_id = str(uuid.uuid4())
    if not tenant_id:
        tenant_id = str(uuid.uuid4())
    return {"Authorization": f"Bearer mock_token_{user_id}_{tenant_id}_{papel}"}

@pytest.mark.asyncio
async def test_students_api_extra() -> None:
    tenant_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    headers = auth_headers(tenant_id=tenant_id, user_id=user_id)
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        
        # Error create
        assert (await ac.post("/api/alunos/", json={"nome":""}, headers=headers)).status_code == 422
        
        school_res = await ac.post("/api/escolas/", json={"nome": "Extra School"}, headers=headers)
        escola_id = school_res.json()["id"]

        # Valid create
        student_res = await ac.post("/api/alunos/", json={
            "nome": "Extra Student",
            "escola_atual_id": escola_id,
            "consentimento_lgpd": True,
            "status": "ativo",
            "laudo": "TEA"
        }, headers=headers)
        assert student_res.status_code == 201
        student_id = student_res.json()["id"]

        # GET detail
        dtl_res = await ac.get(f"/api/alunos/{student_id}", headers=headers)
        assert dtl_res.status_code == 200

        # Create school for transfer
        sch_res = await ac.post("/api/escolas/", json={"nome":"School2"}, headers=headers)
        sch_id = sch_res.json()["id"]

        # Vinculos
        vin_res = await ac.post(f"/api/alunos/{student_id}/vinculos", json={
            "usuario_id": user_id,
            "tipo_papel": "prof_aee"
        }, headers=headers)
        assert vin_res.status_code == 200

        # GET sensitive data
        sens_res = await ac.get(f"/api/alunos/{student_id}/dados-sensiveis?justificativa=necessario para planejar o atendimento", headers=headers)
        assert sens_res.status_code == 200
        assert sens_res.json()["laudo"] == "TEA"

        # Update
        upd_res = await ac.put(f"/api/alunos/{student_id}", json={
            "nome": "Extra Student Updated"
        }, headers=headers)
        assert upd_res.status_code == 200

        # Transfer
        tr_res = await ac.post(f"/api/alunos/{student_id}/transferir", json={
            "nova_escola_id": sch_id
        }, headers=headers)
        assert tr_res.status_code == 200

        # Valid Archive
        arc_res = await ac.post(f"/api/alunos/{student_id}/arquivar", headers=headers)
        assert arc_res.status_code == 200

        # Update archived should fail
        assert (await ac.put(f"/api/alunos/{student_id}", json={"nome":"X"}, headers=headers)).status_code == 400

        # Delete / bad routes or 404
        fake_uuid = str(uuid.uuid4())
        assert (await ac.get(f"/api/alunos/{fake_uuid}", headers=headers)).status_code == 404
        assert (await ac.put(f"/api/alunos/{fake_uuid}", json={}, headers=headers)).status_code == 404
        assert (await ac.post(f"/api/alunos/{fake_uuid}/arquivar", headers=headers)).status_code == 400
        assert (await ac.post(f"/api/alunos/{fake_uuid}/vinculos", json={"usuario_id":user_id, "tipo_papel":"prof_aee"}, headers=headers)).status_code == 400
        assert (await ac.post(f"/api/alunos/{fake_uuid}/transferir", json={"nova_escola_id":sch_id}, headers=headers)).status_code == 400
        assert (await ac.get(f"/api/alunos/{fake_uuid}/dados-sensiveis?justificativa=abcdefghijk", headers=headers)).status_code == 404

        # List with status
        assert (await ac.get("/api/alunos/?status_aluno=ativo", headers=headers)).status_code == 200
        assert (await ac.get("/api/alunos/?status_aluno=inexistente", headers=headers)).status_code == 400
        
