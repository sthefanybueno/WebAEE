## Context

O backend roda em container `python:3.12-slim` (sem `tzdata`) e não define `TZ` globalmente. Consequentemente, `datetime.now()` retorna UTC e o PostgreSQL também opera em UTC por padrão. O sistema AEE deve registrar eventos (atendimentos, autorizações, logs de auditoria LGPD) no horário oficial de Brasília (`America/Sao_Paulo`, UTC-3 no horário padrão e UTC-2 no horário de verão). O pytest-cov já está listado em `dev` no `pyproject.toml`, mas não é invocado no Dockerfile nem documentado como comando de uso.

## Goals / Non-Goals

**Goals:**
- Configurar `TZ=America/Sao_Paulo` no container da API (variável de ambiente + `tzdata`)
- Configurar `PGTZ=America/Sao_Paulo` no container PostgreSQL para conversões automáticas
- Expor comando padronizado para execução de cobertura com relatório terminal e HTML
- Manter threshold de cobertura ≥ 80% configurado no `pyproject.toml`

**Non-Goals:**
- Alterar tipos de coluna no banco (permanecem `TIMESTAMPTZ` — armazenam UTC, exibem no fuso configurado)
- Modificar lógica de negócio existente
- Implementar cobertura no CI/CD (fora do escopo desta mudança)

## Decisions

### D1 — Usar variável de ambiente `TZ` no container, não `zoneinfo` no código

**Decisão:** Definir `TZ=America/Sao_Paulo` via `environment` no `docker-compose.yml` e instalar `tzdata` no `Dockerfile`.

**Rationale:** A variável `TZ` afeta todo o processo Python (incluindo libs de terceiros) sem exigir mudanças no código de aplicação. Usar `zoneinfo` apenas nos modelos seria incompleto — logs da uvicorn, SQLAlchemy e outros usariam UTC.

**Alternativa descartada:** Forçar `datetime.now(tz=ZoneInfo("America/Sao_Paulo"))` em cada ponto de criação de data → frágil, difícil de manter.

### D2 — `tzdata` como dependência do sistema (apt), não do Python

**Decisão:** Instalar `tzdata` via `apt-get` no `Dockerfile` (imagem `python:3.12-slim` não inclui dados de timezone do sistema).

**Rationale:** O módulo `zoneinfo` do Python 3.9+ usa os dados do sistema operacional. Sem `tzdata` instalado, `ZoneInfo("America/Sao_Paulo")` lança `ZoneInfoNotFoundError` no Alpine/slim.

### D3 — Relatório de cobertura terminal + HTML

**Decisão:** Configurar `--cov-report=term-missing` (padrão) e `--cov-report=html:htmlcov` (opcional, para inspeção local).

**Rationale:** O relatório terminal é suficiente para CI; HTML permite navegação interativa durante desenvolvimento.

## Risks / Trade-offs

- **Horário de verão:** `America/Sao_Paulo` com `tzdata` atualizado lida automaticamente com DST. Risco baixo desde que `tzdata` seja mantido atualizado na imagem. → Mitigação: fixar versão mínima `tzdata>=2024a` via apt.
- **Dados históricos no banco:** Timestamps já gravados em UTC não são reinterpretados — permanecem corretos pois são `TIMESTAMPTZ`. A conversão ocorre apenas na exibição. → Sem ação necessária.
- **Rebuild obrigatório:** A mudança no `Dockerfile` exige `docker-compose up --build` para ter efeito. Documentar no GUIA.md.

## Migration Plan

1. Atualizar `backend/Dockerfile` — instalar `tzdata`, garantir `pytest-cov` nas dependências
2. Atualizar `docker-compose.yml` — adicionar `TZ` e `PGTZ`
3. Atualizar `backend/pyproject.toml` — adicionar `[coverage.report]` com `html` e documentar comando
4. Reconstruir container: `docker-compose up --build -d`
5. Verificar fuso: `docker exec aee_api python -c "import datetime; print(datetime.datetime.now())"`
6. Executar cobertura: `docker exec aee_api python -m pytest --cov=app --cov-report=term-missing`

**Rollback:** Remover variáveis `TZ`/`PGTZ` e reconstruir — sem impacto em dados.
