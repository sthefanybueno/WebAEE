"""
Testes de integração para router de sync.
"""
import uuid
import pytest
from typing import AsyncGenerator
from httpx import ASGITransport, AsyncClient
from datetime import datetime, timezone, timedelta

from sqlmodel.ext.asyncio.session import AsyncSession
from app.infrastructure.database import engine, init_db, get_session
from app.domain.models import Student
from app.domain.entities.report import Report
from app.domain.models import StatusAluno
from app.main import app


def auth_headers(papel: str = "coordenacao", tenant_id: str|None=None) -> dict[str, str]:
    user_id = uuid.uuid4()
    if not tenant_id:
        tenant_id = uuid.uuid4()
    return {"Authorization": f"Bearer mock_token_{user_id}_{tenant_id}_{papel}"}

@pytest.mark.asyncio
async def test_sync_pull_and_resolve() -> None:
    # Insere dados dummy direto no banco via API (via rotas de alunos e reports já testadas, ou direto)
    tenant_id = str(uuid.uuid4())
    headers = auth_headers(tenant_id=tenant_id)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        school_res = await ac.post("/api/escolas/", json={"nome": "Sync School"}, headers=headers)
        escola_id = school_res.json()["id"]

        # Create student via API
        student_res = await ac.post("/api/alunos/", json={
            "nome": "Sync Student",
            "escola_atual_id": escola_id,
            "consentimento_lgpd": True
        }, headers=headers)
        student_id = student_res.json()["id"]

        # Create report via API
        report_res = await ac.post("/api/relatorios/", json={
            "tipo": "aee",
            "aluno_id": student_id,
            "conteudo_json": {"texto": "initial"}
        }, headers=headers)
        report_id = report_res.json()["id"]

        # Call Sync PULL
        # Let's set a date from yesterday
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        yesterday = yesterday.replace("+", "%2B") # encode plus sign
        pull_res = await ac.get(f"/api/sync/pull?last_sync={yesterday}", headers=headers)
        assert pull_res.status_code == 200
        pull_data = pull_res.json()
        assert len(pull_data["alunos"]) >= 1
        assert len(pull_data["relatorios"]) >= 1

        # Call Resolve Conflict
        resolve_res = await ac.post("/api/sync/reports/resolve", json={
            "report_id": report_id,
            "resolved_content": {"texto": "resolved"}
        }, headers=headers)
        assert resolve_res.status_code == 200
        
        # Test 404 for resolve conflict
        fake_id = str(uuid.uuid4())
        ref_404 = await ac.post("/api/sync/reports/resolve", json={
            "report_id": fake_id, "resolved_content": {}
        }, headers=headers)
        assert ref_404.status_code == 404
