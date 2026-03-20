# Tarefas: sistema-aee-mvp

## Plano de Implementação

Total estimado: **60 horas** | Stack: FastAPI (Python) + Next.js + PostgreSQL + Docker

> **Convenção TDD:** cada bloco começa com a etapa **🔴 RED** (escrever testes que falham),
> seguida de **🟢 GREEN** (implementação mínima). Nenhuma tarefa de implementação deve
> ser iniciada sem os testes correspondentes escritos e falhando.

---

## Fase 0 — Docker e Infraestrutura de Base (4h)

> **Pré-requisito de tudo:** sem o ambiente rodando, nenhuma etapa TDD é verificável.

- [ ] **T-01** Criar estrutura de monorepo (`/backend`, `/frontend`, `docker-compose.yml`)
- [ ] **T-02** Criar `docker-compose.yml` com serviços: `db` (PostgreSQL 16), `api` (FastAPI), `web` (Next.js); redes `backend_network` e `frontend_network` separadas; volume permanente `postgres_data`
- [ ] **T-03** Criar `.env.example` com todas as variáveis obrigatórias (backend e frontend). Variáveis secretas NUNCA commitadas
- [ ] **T-04** Validar que `docker compose up --build` sobe os três serviços sem erro e que `GET /docs` (FastAPI) retorna 200
- [ ] **T-05** Configurar linting: `ruff` + `mypy` (backend), `eslint` + `prettier` (frontend)
- [ ] **T-06** Configurar GitHub Actions: jobs de lint, test e build em push/PR para `main` — PR bloqueado sem todos os checks verdes

---

## Fase 1 — Backend: Domínio (DDD + TDD) (10h)

### 🔴 RED — Testes do Domínio (escritos ANTES da implementação)

- [ ] **T-10** Escrever testes unitários para as entidades puras (`Usuario`, `Aluno`, `RelatorioAEE`, `Foto`) — devem falhar com `ImportError` ou `AssertionError` confirmando que nada está implementado
- [ ] **T-11** Escrever testes para os value objects (`Papel`, `StatusAluno`, `TagPedagogica`): validar transições permitidas e rejeições de valores inválidos — todos devem falhar
- [ ] **T-12** Escrever testes para as regras puras de negócio: soft-delete de aluno, consentimento LGPD obrigatório, vínculo de professor × escola — todos devem falhar

### 🟢 GREEN — Implementar Domínio

- [ ] **T-13** Implementar entidades de domínio em `domain/` (sem imports de frameworks). Rodar T-10: MUST passar 100%
- [ ] **T-14** Implementar value objects via `Enum` e dataclasses tipadas. Rodar T-11: MUST passar 100%
- [ ] **T-15** Implementar regras puras de negócio. Rodar T-12: MUST passar 100%
- [ ] **T-16** Rodar `mypy` + `ruff` no módulo `domain/` — zero erros permitidos

---

## Fase 2 — Backend: Banco de Dados e Casos de Uso (10h)

### Banco de Dados

- [ ] **T-20** Criar modelos SQLModel (`Table=True`) para `users`, `schools`, `students`, `professor_assignments`; foreign keys e índices declarados
- [ ] **T-21** Criar modelos de relatórios e fotos com chaves estrangeiras interconectadas
- [ ] **T-22** Configurar Alembic; criar e aplicar primeira migration — `alembic upgrade head` MUST passar no contêiner `db` sem erro
- [ ] **T-23** Adicionar políticas RLS do PostgreSQL via raw SQL; verificar no contêiner de teste que papel errado retorna zero rows

### 🔴 RED — Testes dos Casos de Uso (escritos ANTES da implementação)

- [ ] **T-25** Escrever testes de caso de uso para auth JWT: expiração, papel incorreto, token inválido — todos devem falhar
- [ ] **T-26** Escrever testes de caso de uso para CRUD de usuários: rejeitar campos extra, validar role no payload — devem falhar
- [ ] **T-27** Escrever testes de caso de uso para gestão de alunos: consentimento LGPD obrigatório (HTTP 422), soft-delete nunca executa `DELETE FROM` — devem falhar
- [ ] **T-28** Escrever testes de caso de uso para relatórios: bloquear tipo errado por papel (Profissional de Apoio bloqueado em Trimestral), salvar JSON válido — devem falhar
- [ ] **T-29** Escrever testes para audit_log: toda leitura de campo sensível MUST gerar linha em `audit_log` — deve falhar

### 🟢 GREEN — Implementar Casos de Uso

- [ ] **T-30** Implementar auth JWT com rotating tokens (TTL via env). Rodar T-25: MUST passar 100%
- [ ] **T-31** Implementar CRUD de usuários com `BaseModel` Pydantic v2 (`Extra.forbid`). Rodar T-26: MUST passar 100%
- [ ] **T-32** Implementar lógica de alunos com soft-delete e interceptor HTTP 422 para consentimento. Rodar T-27: MUST passar 100%
- [ ] **T-33** Implementar lógica de relatórios com guard de papel e validação de JSONB. Rodar T-28: MUST passar 100%
- [ ] **T-34** Implementar inserção automática em `audit_log` em todos os campos `diagnostico`/`laudo`. Rodar T-29: MUST passar 100%
- [ ] **T-35** Implementar lógica de foto com simulador de bucket (volume local); audit_log validado nos logs

---

## Fase 3 — Backend: Componentes e Rotas FastAPI (8h)

### 🔴 RED — Testes dos Componentes da API (escritos ANTES)

- [ ] **T-40** Escrever testes para o decorator `@requer_papel([...])`: fazer fake request com papel errado — MUST retornar 403, deve falhar
- [ ] **T-41** Escrever testes de schema Pydantic de request/response: campos obrigatórios, rejeição de extra fields — devem falhar
- [ ] **T-42** Escrever testes de CORS: origem não-autorizada MUST ser rejeitada — deve falhar

### 🟢 GREEN — Implementar Componentes da API

- [ ] **T-43** Implementar decorator `@requer_papel` com extração de JWT. Rodar T-40: MUST passar 100%
- [ ] **T-44** Implementar todos os schemas Pydantic de request/response em `interfaces/`. Rodar T-41: MUST passar 100%
- [ ] **T-45** Configurar CORS restritivo no FastAPI (lista branca de origens, nunca `*`). Rodar T-42: MUST passar 100%

### 🔴 RED — Testes das Rotas (escritos ANTES)

- [ ] **T-47** Escrever testes de rota para `/auth`, `/usuarios`, `/alunos`: body inválido, token ausente, papel incorreto — devem falhar
- [ ] **T-48** Escrever testes de rota para `/relatorios` e `/fotos`: validar permissões cruzadas entre todos os 4 papéis — devem falhar

### 🟢 GREEN — Implementar Rotas FastAPI

- [ ] **T-49** Implementar routers FastAPI apontando para `response_model` Pydantic. Rodar T-47: MUST passar 100%
- [ ] **T-50** Implementar routers de relatórios e fotos. Rodar T-48: MUST passar 100%
- [ ] **T-51** Validar: `docker compose up api db` + `GET /docs` retorna 200 sem stacktraces

---

## Fase 4 — Backend: Testes de Integração com Banco de Dados (4h)

> **Integração logo após as rotas**, usando banco real PostgreSQL (não SQLite em memória).

- [ ] **T-55** Testes de integração de API: fluxo completo por papel (auth → ação → resultado no banco)
- [ ] **T-56** Testes de autorização cruzada (tabela obrigatória):

| Cenário | Resultado esperado |
|---|---|
| Profissional de Apoio tenta cadastrar aluno | 403 Forbidden |
| Prof. Regente tenta criar Relatório Anual | 403 Forbidden |
| Profissional de Apoio tenta criar Relatório Trimestral | 403 Forbidden |
| Prof. Regente cria Relatório Trimestral (aluno vinculado) | 201 Created |
| Profissional de Apoio cria Relatório Anual (aluno vinculado) | 201 Created |
| Profissional de Apoio faz upload de foto (aluno vinculado) | 201 Created |
| Prof. Regente faz upload de foto (aluno vinculado) | 201 Created |
| Coordenação acessa qualquer endpoint | 200/201 OK |

- [ ] **T-57** Testes de RLS PostgreSQL: validar isolamento de dados entre papéis e entre tenants (rows de tenant A nunca visíveis para tenant B)
- [ ] **T-58** Cobertura mínima alvo: 80% nas camadas `application/` e `interfaces/` — verificado com `pytest --cov`

---

## Fase 5 — Frontend Core (16h)

### Setup

- [ ] **T-60** Instalar Next.js (latest) via Docker; configurar `shadcn/ui` (`button card dialog form select`); compilar Build sem erro
- [ ] **T-61** Instalar e configurar Dexie.js (schema: `relatorios_pendentes`, `fotos_pendentes`) e `next-pwa` (cache do shell)
- [ ] **T-62** Implementar NextAuth JWT com mapping de sessão para `Papel`/`tenant_id` em layout de server
- [ ] **T-63** Implementar proteção de rota server-side; validar redirecionamentos `302/401` para acessos cruzados
- [ ] **T-64** Criar layouts de agrupamento `(coordenacao)`, `(prof_aee)`, `(apoio)`, `(regente)` — validar hidratação SSR/CSR sem mismatch

### 🔴 RED — Testes de Componentes Frontend (escritos ANTES)

- [ ] **T-66** Escrever testes com React Testing Library para o formulário de Login: envio em branco MUST sublinhar campos de vermelho — deve falhar
- [ ] **T-67** Escrever testes para o formulário de Aluno: checkbox de consentimento LGPD desmarcado MUST bloquear envio — deve falhar
- [ ] **T-68** Escrever testes para o fluxo "📸 Registrar Momento": 3 passos completos em ≤ 3 toques — deve falhar

### 🟢 GREEN — Implementar Telas e Componentes

- [ ] **T-69** Tela Login: Server Component + Form Client (shadcn Form + zod). Rodar T-66: MUST passar
- [ ] **T-70** Dashboard interativo por papel: buscar dados do backend, layout shadcn Cards
- [ ] **T-71** CRUD Alunos (`'use client'`): formulário zod com bloqueio de consentimento LGPD. Rodar T-67: MUST passar
- [ ] **T-72** Interface de Relatórios: formulário dinâmico com fallback offline para IndexedDB
- [ ] **T-73** Modal "📸 Registrar Momento" (`shadcn Dialog`): navegação em 3 passos, 60fps garantido. Rodar T-68: MUST passar
- [ ] **T-74** PDF export via `@react-pdf/renderer` importado com `next/dynamic` — validar `npm run build` sem erro SSR

---

## Fase 6 — PWA Offline-First (4h)

- [ ] **T-80** Configurar Service Worker via `next-pwa` (cache do shell offline)
- [ ] **T-81** Implementar escrita-em-IndexedDB-primeiro em todas as ações de criar/editar
- [ ] **T-82** Implementar fila de sync (dispara ao `navigator.onLine` voltar `true`): bulk POST idempotente para `/api/sync/*`
- [ ] **T-83** Detectar conflito de relatório via `updated_at`: versão mais recente prevalece; setar `conflict_flag: true` e exibir aviso na próxima abertura
- [ ] **T-84** Indicador visual de status online/offline no cabeçalho em todas as telas

---

## Fase 7 — E2E e CI/CD (4h)

- [ ] **T-90** Testes E2E Playwright: fluxo completo por papel (login → ação → resultado)
- [ ] **T-91** Teste E2E específico: "📸 Registrar Momento" offline→sync em ≤ 3 toques
- [ ] **T-92** Pipeline GitHub Actions completo: lint + test + build + E2E em push/PR
- [ ] **T-93** Build Docker multi-stage (imagem de produção mínima)

---

## Critérios de Aceite (MVP Completo)

- [ ] Coordenação consegue cadastrar usuários de qualquer tipo, visualizar todos os dados e comentar relatórios — mas NÃO cria nem edita relatórios
- [ ] Prof. AEE consegue cadastrar aluno, vincular Profissional de Apoio e criar todos os tipos de relatório
- [ ] Profissional de Apoio consegue criar Relatório Anual e enviar foto de aluno vinculado
- [ ] Prof. Regente consegue criar Relatório Trimestral e enviar foto de aluno vinculado
- [ ] Transferência de escola revoga acesso da professora anterior corretamente
- [ ] "📸 Registrar Momento" funciona offline em ≤ 3 toques e sincroniza ao reconectar
- [ ] RLS impede vazamento de dados entre papéis (verificado por testes de integração com BD real)
- [ ] `docker compose up --build` sobe todo o ambiente sem configuração manual

---

## Adiado para Fase 2

- Notificação automática de transferência de escola
- Editor visual de templates (drag-and-drop)
- Cron de expiração automática de dados LGPD

## Permanentemente Fora do Escopo

- Magic link / autenticação sem senha
- Portal de responsáveis / pais
- Exclusão física de qualquer dado do banco
- Expansão multi-tenant (múltiplas SEMEDs)
