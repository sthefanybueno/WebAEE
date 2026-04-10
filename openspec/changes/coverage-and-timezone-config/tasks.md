## 1. Dockerfile — Fuso Horário e Dependências

- [ ] 1.1 Adicionar `tzdata` no bloco de dependências do sistema (`apt-get install`) no `backend/Dockerfile`
- [ ] 1.2 Adicionar variável de ambiente `ENV TZ=America/Sao_Paulo` no `backend/Dockerfile` após a instalação do `tzdata`
- [ ] 1.3 Garantir que `pytest-cov>=5.0` esteja listado nas dependências instaladas via `pip` no `Dockerfile` (já está em `pyproject.toml` dev, confirmar que está no `RUN pip install` do Dockerfile)

## 2. docker-compose.yml — Variáveis de Ambiente

- [ ] 2.1 Adicionar `TZ: America/Sao_Paulo` na seção `environment` do serviço `api`
- [ ] 2.2 Adicionar `PGTZ: America/Sao_Paulo` na seção `environment` do serviço `db` (PostgreSQL)
- [ ] 2.3 Adicionar `TZ: America/Sao_Paulo` na seção `environment` do serviço `pgadmin` (opcional, para consistência)

## 3. pyproject.toml — Configuração de Cobertura

- [ ] 3.1 Confirmar que `[tool.coverage.report]` tem `fail_under = 80` e `show_missing = true` (já existem, verificar)
- [ ] 3.2 Adicionar `[tool.coverage.report]` com `skip_empty = true` para limpar relatório
- [ ] 3.3 Documentar o comando de cobertura em comentário no `pyproject.toml` ou no `GUIA.md`

## 4. Rebuild e Verificação

- [ ] 4.1 Executar `docker-compose up --build -d` para reconstruir o container com as novas configurações
- [ ] 4.2 Verificar fuso no container: `docker exec aee_api python -c "import datetime; print(datetime.datetime.now())"`
- [ ] 4.3 Verificar fuso no PostgreSQL: `docker exec aee_db psql -U aee_user -d aee_db -c "SELECT NOW()"`
- [ ] 4.4 Executar teste de cobertura: `docker exec aee_api python -m pytest --cov=app --cov-report=term-missing`
- [ ] 4.5 Confirmar que todos os 33 testes passam e cobertura ≥ 80%
