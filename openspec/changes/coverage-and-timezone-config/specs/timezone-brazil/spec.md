## ADDED Requirements

### Requirement: Fuso horário America/Sao_Paulo no container da API
O container da API SHALL executar com `TZ=America/Sao_Paulo` definido como variável de ambiente e `tzdata` instalado no sistema, de forma que `datetime.now()` retorne o horário de Brasília sem nenhuma alteração no código de aplicação.

#### Scenario: Verificação de fuso horário no container
- **WHEN** o desenvolvedor executa `docker exec aee_api python -c "import datetime; print(datetime.datetime.now())"`
- **THEN** o horário exibido corresponde ao horário de Brasília (UTC-3 ou UTC-2 em horário de verão)

### Requirement: Fuso horário America/Sao_Paulo no PostgreSQL
O container PostgreSQL SHALL executar com `PGTZ=America/Sao_Paulo`, de forma que consultas de timestamp sem conversão explícita retornem o horário de Brasília.

#### Scenario: Consulta de timestamp no banco
- **WHEN** uma query `SELECT NOW()` é executada no banco via `docker exec aee_db psql -U aee_user -d aee_db -c "SELECT NOW()"`
- **THEN** o timestamp retornado corresponde ao horário de Brasília com sufixo de offset correto (ex: `-03:00`)
