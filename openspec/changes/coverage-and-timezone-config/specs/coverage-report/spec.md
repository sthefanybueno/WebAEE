## ADDED Requirements

### Requirement: Execução de cobertura de testes via Docker
O sistema SHALL permitir a execução do relatório de cobertura de testes com o comando `docker exec aee_api python -m pytest --cov=app --cov-report=term-missing`, atingindo threshold mínimo de 80%.

#### Scenario: Relatório de cobertura no terminal
- **WHEN** o desenvolvedor executa `docker exec aee_api python -m pytest --cov=app --cov-report=term-missing`
- **THEN** o pytest exibe a tabela de cobertura por módulo, indica as linhas não cobertas e exibe o total ≥ 80%

#### Scenario: Falha quando cobertura abaixo do threshold
- **WHEN** o desenvolvedor executa o comando de cobertura e a cobertura total é inferior a 80%
- **THEN** o pytest retorna exit code diferente de zero e exibe mensagem indicando o threshold violado
