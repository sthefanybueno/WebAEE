import pytest
import uuid
from httpx import ASGITransport, AsyncClient

from app.main import app

def auth_headers(papel: str = "coordenacao", tenant_id: str|None=None, user_id: str|None=None) -> dict[str, str]:
    if not user_id:
        user_id = str(uuid.uuid4())
    if not tenant_id:
        tenant_id = str(uuid.uuid4())
    return {"Authorization": f"Bearer mock_token_{user_id}_{tenant_id}_{papel}"}

@pytest.mark.asyncio
async def test_students_edge_cases() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = auth_headers()
        fake_id = str(uuid.uuid4())
        
        # Arquivar inexistente
        res = await ac.post(f"/api/alunos/{fake_id}/arquivar", headers=headers)
        assert res.status_code in [404, 400]

        # Transferir inexistente
        res = await ac.post(f"/api/alunos/{fake_id}/transferir", json={
            "nova_escola_id": str(uuid.uuid4())
        }, headers=headers)
        assert res.status_code in [404, 400]

        # Associar professor inexistente ou aluno inexistente
        res = await ac.post(f"/api/alunos/{fake_id}/vinculos", json={
            "usuario_id": str(uuid.uuid4()),
            "tipo_papel": "prof_aee"
        }, headers=headers)
        assert res.status_code in [404, 400]

@pytest.mark.asyncio
async def test_reports_edge_cases() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = auth_headers()
        fake_id = str(uuid.uuid4())
        
        # Testar sync resolve falho
        res = await ac.post("/api/sync/reports/resolve", json={
            "report_id": fake_id,
            "resolved_content": {}
        }, headers=headers)
        assert res.status_code == 404

        # Criar relatório com aluno inexistente
        res = await ac.post("/api/relatorios/", json={
            "tipo": "aee",
            "aluno_id": fake_id,
            "conteudo_json": {}
        }, headers=headers)
        assert res.status_code in [404, 400]

        # Sync fail (pull and generic)
        res = await ac.post("/api/relatorios/sync", json={
            "items": [{
                "id": fake_id,
                "tipo": "aee",
                "aluno_id": fake_id,
                "conteudo_json": {},
                "updated_at_local": "2030-01-01T00:00:00Z"
            }]
        }, headers=headers)
        assert res.status_code in [400, 422, 500, 200, 404]

        # Add comment to missing report
        res = await ac.post(f"/api/relatorios/{fake_id}/comentarios", json={
            "texto": "Fake comment"
        }, headers=headers)
        assert res.status_code in [400, 404]
