## Why

O backend não expõe um mecanismo padronizado para executar testes de cobertura via Docker, e todas as datas persistidas ignoram o fuso horário `America/Sao_Paulo`, gerando inconsistências entre o horário real do sistema e os timestamps gravados no banco.

## What Changes

- Adicionar suporte ao pytest-cov para geração de relatório de cobertura dentro do container Docker
- Configurar a variável de ambiente `TZ=America/Sao_Paulo` no container da API e no PostgreSQL
- Garantir que timestamps com fuso horário (`TIMESTAMPTZ`) sejam retornados corretamente convertidos para `America/Sao_Paulo`
- Adicionar a lib `tzdata` ao Dockerfile para suporte nativo ao fuso horário no Alpine/slim

## Capabilities

### New Capabilities

- `coverage-report`: Capacidade de executar `python -m pytest --cov=app --cov-report=term-missing` dentro do container e obter relatório de cobertura ≥ 80%
- `timezone-brazil`: Configuração de fuso horário `America/Sao_Paulo` no container da API, no PostgreSQL e no código Python, garantindo que `datetime.now()` e timestamps do banco respeitem o horário de Brasília

### Modified Capabilities

- `docker-compose-config`: Adição de variável `TZ` e `PGTZ` no `docker-compose.yml`

## Impact

- **Dockerfile** (`backend/Dockerfile`): adicionar `tzdata` e `pytest-cov`
- **docker-compose.yml**: variáveis `TZ=America/Sao_Paulo` e `PGTZ=America/Sao_Paulo`
- **pyproject.toml**: garantir `pytest-cov>=5.0` em dependências dev
- **app/core/config.py** ou equivalente: configurar `TZ` via código Python como fallback
- Nenhuma quebra de API — mudança transparente para os clientes
