"""
Testes de integração para router de reports.
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
async def test_reports_api_full_flow() -> None:
    tenant_id = str(uuid.uuid4())
    headers = auth_headers(tenant_id=tenant_id)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        
        # 1. Templates
        templates_res = await ac.get("/api/relatorios/templates", headers=headers)
        assert templates_res.status_code == 200
        assert isinstance(templates_res.json(), list)

        school_res = await ac.post("/api/escolas/", json={"nome": "Report School"}, headers=headers)
        escola_id = school_res.json()["id"]
        
        # Create student for reports
        student_res = await ac.post("/api/alunos/", json={
            "nome": "Report Student",
            "escola_atual_id": escola_id,
            "consentimento_lgpd": True
        }, headers=headers)
        student_id = student_res.json()["id"]

        # Create report
        report_res = await ac.post("/api/relatorios/", json={
            "tipo": "aee",
            "aluno_id": student_id,
            "conteudo_json": {"k": "v"}
        }, headers=headers)
        assert report_res.status_code == 201
        report_id = report_res.json()["id"]

        # Get Report Detail
        dtl_res = await ac.get(f"/api/relatorios/{report_id}", headers=headers)
        assert dtl_res.status_code == 200
        assert dtl_res.json()["conteudo_json"]["k"] == "v"

        # Update report
        upd_res = await ac.put(f"/api/relatorios/{report_id}", json={
            "conteudo_json": {"k": "v2"}
        }, headers=headers)
        assert upd_res.status_code == 200

        # Add comment
        com_res = await ac.post(f"/api/relatorios/{report_id}/comentarios", json={
            "texto": "Um comentario"
        }, headers=headers)
        assert com_res.status_code == 200

        # Sync Reports array
        sync_res = await ac.post("/api/relatorios/sync", json={
            "items": [{
                "id": str(uuid.uuid4()),
                "tipo": "aee",
                "aluno_id": student_id,
                "conteudo_json": {"mock": True},
                "updated_at_local": "2030-01-01T00:00:00Z"
            }]
        }, headers=headers)
        assert sync_res.status_code == 200
        assert len(sync_res.json()) == 1

        # Fallbacks 404
        fake_id = str(uuid.uuid4())
        assert (await ac.get(f"/api/relatorios/{fake_id}", headers=headers)).status_code == 404
        assert (await ac.get(f"/api/relatorios/aluno/{fake_id}", headers=headers)).status_code == 404
        assert (await ac.put(f"/api/relatorios/{fake_id}", json={"conteudo_json":{}}, headers=headers)).status_code == 404
        assert (await ac.post(f"/api/relatorios/{fake_id}/comentarios", json={"texto":""}, headers=headers)).status_code == 400

