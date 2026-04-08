"""
Script de teste integrado: pinga todos os endpoints + testa o POST /api/alunos/
com payload real contendo datetime ISO com timezone.
"""
import asyncio
import uuid
import httpx

BASE = "http://localhost:8000"

async def main():
    async with httpx.AsyncClient(base_url=BASE, timeout=10) as client:
        # ─── 1. Login ────────────────────────────────────────────────
        resp = await client.post("/api/auth/login", data={"username": "admin@webaee.com", "password": "123"})
        token_data = resp.json()
        token = token_data.get("access_token", "")
        bearer = {"Authorization": f"Bearer {token}"}
        print(f"[AUTH] token={token[:40]}...")

        # Extrair tenant_id do token
        parts = token.split("_")
        tenant_id = parts[3] if len(parts) > 3 else str(uuid.uuid4())

        # ─── 2. Cria escola no tenant ────────────────────────────────
        escola_resp = await client.post(
            "/api/escolas/",
            json={"nome": "Escola Teste Fuzzer"},
            headers=bearer
        )
        if escola_resp.status_code == 201:
            escola_id = escola_resp.json()["id"]
            print(f"[ESCOLA] criada: {escola_id}")
        else:
            # Tenta listar e pegar a primeira
            list_resp = await client.get("/api/escolas/", headers=bearer)
            escolas = list_resp.json()
            if escolas:
                escola_id = escolas[0]["id"]
                print(f"[ESCOLA] reutilizando: {escola_id}")
            else:
                print("[ESCOLA] falhou criação e listagem!")
                return

        # ─── 3. POST /api/alunos/ com datetime ISO com timezone ─────
        aluno_payload = {
            "nome": "Sthefany Teste",
            "escola_atual_id": escola_id,
            "consentimento_lgpd": True,
            "data_nascimento": "2000-01-15T00:00:00.000Z",  # <-- timezone-aware
            "diagnostico": "TDAH",
            "laudo": "Laudo Médico",
            "base_legal": "Art. 58 LDB"
        }
        aluno_resp = await client.post("/api/alunos/", json=aluno_payload, headers=bearer)
        if aluno_resp.status_code == 201:
            print(f"[ALUNO] criado com sucesso! id={aluno_resp.json()['id']}")
        else:
            print(f"[ALUNO] FALHOU {aluno_resp.status_code}: {aluno_resp.text[:200]}")

        # ─── 4. Varredura global de 500s ─────────────────────────────
        openapi = await client.get("/openapi.json")
        paths = openapi.json()["paths"]
        print("\n[FUZZER] Varrendo todos os endpoints...")
        failed = []
        for path, methods in paths.items():
            for method in methods:
                url = path.replace("{id}", str(uuid.uuid4()))\
                          .replace("{student_id}", str(uuid.uuid4()))\
                          .replace("{report_id}", str(uuid.uuid4()))
                try:
                    if method == "get":
                        r = await client.get(url, headers=bearer)
                    elif method == "post":
                        r = await client.post(url, json={}, headers=bearer)
                    elif method == "put":
                        r = await client.put(url, json={}, headers=bearer)
                    elif method == "delete":
                        r = await client.delete(url, headers=bearer)
                    else:
                        continue
                    if r.status_code == 500:
                        failed.append(f"{method.upper()} {path}")
                except Exception as e:
                    failed.append(f"{method.upper()} {path} -> {e}")

        if failed:
            print(f"\n[RESULT] {len(failed)} FALHAS 500:")
            for f in failed:
                print(f"  ❌ {f}")
        else:
            print("\n[RESULT] ✅ ZERO erros 500 em todos os endpoints!")

asyncio.run(main())
