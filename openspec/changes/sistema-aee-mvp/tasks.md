# Tarefas: sistema-aee-mvp

## Plano de Implementação

Total estimado: **60 horas** | Stack: FastAPI (Python) + Next.js + PostgreSQL + Docker

---

## Fase 0 — Setup e Infraestrutura (4h)

- [ ] **T-01** Criar estrutura de monorepo (`/backend`, `/frontend`, `/docker-compose.yml`)
- [ ] **T-02** Configurar `docker-compose.yml` com serviços: `backend`, `db` (PostgreSQL 16), `frontend`
- [ ] **T-03** Criar `.env.example` para backend e frontend com todas as variáveis necessárias
- [ ] **T-04** Configurar GitHub Actions: jobs de lint, test e build em push/PR para `main`
- [ ] **T-05** Configurar linting: `ruff` + `mypy` (backend), `eslint` + `prettier` (frontend)

---

## Fase 1 — Backend Core (20h)

### Domínio (DDD)
- [ ] **T-10** Definir entidades puras de domínio (`Usuario`, `Aluno`, `RelatorioAEE`, etc) e validar conformidade com Python 3.12 types.
- [ ] **T-11** Definir value objects estritos (`Papel`, `StatusAluno`, `TagPedagogica`) usando Enum e validar com um test assert básico.
- [ ] **T-12** Implementar regras puras de negócio e rodar check de types do `mypy`/`ruff` OBRIGATORIAMENTE para atestar Type Safety.

### Banco de Dados
- [ ] **T-13** Criar modelos SQLAlchemy restritos com foreign keys (`users`, `schools`, `students`) e rodar validator pra syntax.
- [ ] **T-14** Criar modelos de vínculos e relatórios com chaves estrangeiras interconectadas e Índices (e.g., `professor_assignments`).
- [ ] **T-15** Configurar Alembic, criar e comitar a primeira migration (`alembic upgrade head` MUST passar 100% liso no contêiner docker `db`).
- [ ] **T-16** Adicionar políticas estruturais RLS do Postgres via raw SQL e verificar aplicabilidade num container de teste.

### Contratos e Casos de Uso (TypeSafe)
- [ ] **T-18** Implementar auth via Pydantic v2 schemas: validar intercept e expiração JWT (`pytest` ou assert manual test).
- [ ] **T-19** Implementar CRUD Pydantic de usuários baseando-se em `BaseModel` estritos (Rejeitar Extra fields). Rodar specs.
- [ ] **T-20** Implementar lógica estruturada de `alunos` com soft-delete. Adicionar interceptor contra HTTP 422 na camada.
- [ ] **T-21** Inserção estrita de relatórios (Validar block against malformed JSONB data test).
- [ ] **T-22** Salvar foto c/ simulador de bucket falso ou volume e auditoria automática gerando Logs validados (`audit_log`).

### API (FastAPI Routers)
- [ ] **T-25** Expor routers apontando exclusivamente para schemas Pydantic atrelados a `response_model` do FastAPI.
- [ ] **T-26** Testar Decorator `@requer_papel([...])`: fazer fake request e garantir MUST return 403 Forbidden para permissão cruzada.
- [ ] **T-27** Subir Docker api contêiner `docker compose up api db` e bater `GET /docs` validando que aplicação inicializa completamente sem stacktraces de import ou env vars.

---

## Fase 2 — Frontend Core (20h)

### Setup (App Router)
- [ ] **T-30** Instalar Next.js 14 via Docker e configurar **APENAS shadcn/ui** (`npx shadcn-ui@latest add button card dialog form select`). OBRIGATÓRIO: garantir comando de compilação Build sem erro no fim do estágio.
- [ ] **T-31** Implementar NextAuth JWT configurado garantindo mapping da sessão para Papel/Tenant em layout de server.
- [ ] **T-32** Componentar proteção de rota (Server side logic app config) e validar redirecionamentos `302/401` com acessos cruzados.

### Componentes Globais e Estruturais
- [ ] **T-34** Criar Layouts de Agrupamento `(coordenacao)`, `(apoio)` Server-Side provando que hidratam corretamente (sem erro de mismatch SSR/CSR).
- [ ] **T-35** Abstraição Offline-First do Dexie.js (`use client`). Comprovar renderização limpa da store com checagem assíncrona onMount no hook.

### Telas Críticas e Validações UI Estritas
- [ ] **T-38** Tela: Login Page Server Component + Form Client Component (usando shadcn Form). TESTAR: tentar enviar em branco MUST sublinhar campos visualmente de vermelho.
- [ ] **T-39** Tela: Dashboard interativo. Buscar do backend e encaixar no layout Card do shadcn. TESTAR build visual.
- [ ] **T-40** CRUD Alunos (`'use client'` page bounds). Formulário interativo (zod) protegendo envio a `/alunos`. Validar bloqueios explícitos no browser.
- [ ] **T-42** Interface Formulário Dinâmico de Relatórios. Validar montagem do JSON em submissões offline (`IndexedDB catch block test`).
- [ ] **T-44** Modal Drawer 📸 Registrar Momento (`'use client'`). Implementar a navegação nos "3 passos". MUST usar `shadcn Dialog/Drawer` limitando reflow para garantir 60fps local.
- [ ] **T-45** PDF export (usar lib `@react-pdf/renderer` de client only) importado dinamicamente via `next/dynamic` sem quebrar o next SSR output. Validar build (npm run build de check).

---

## Fase 3 — Testes e CI/CD (12h)

### Backend (TDD)
- [ ] **T-50** Escrever testes unitários para todos os casos de uso (pytest + pytest-asyncio)
- [ ] **T-51** Escrever testes de integração de API: autorização por papel (403 para acessos inválidos)
- [ ] **T-52** Testes de RLS: validar isolamento entre papéis e entre tenants
- [ ] **T-53** Cobertura mínima alvo: 80% nas camadas `application` e `interfaces`

### Casos de teste obrigatórios de autorização

| Cenário | Resultado esperado |
|---|---|
| Prof. Apoio tenta cadastrar aluno | 403 Forbidden |
| Prof. PI tenta criar Relatório Anual | 403 Forbidden |
| Prof. Apoio tenta criar Relatório Trimestral | 403 Forbidden |
| Prof. PI cria Relatório Trimestral (aluno vinculado) | 201 Created |
| Prof. Apoio cria Relatório Anual (aluno vinculado) | 201 Created |
| Prof. Apoio faz upload de foto (aluno vinculado) | 201 Created |
| Prof. PI faz upload de foto (aluno vinculado) | 201 Created |
| Coordenação acessa qualquer endpoint | 200/201 OK |

### Frontend
- [ ] **T-54** Testes de componentes críticos com Jest + React Testing Library
- [ ] **T-55** Testes E2E com Playwright: fluxo completo por papel (login → ação → resultado)
- [ ] **T-56** Teste E2E específico: "📸 Registrar Momento" em ≤ 3 toques

### CI/CD
- [ ] **T-57** Pipeline GitHub Actions: lint (ruff + eslint) + test (pytest + jest) + build
- [ ] **T-58** Configurar build Docker multi-stage (menor imagem de produção)
- [ ] **T-59** PR bloqueado sem todos os checks verdes

---

## Fase 4 — PWA Offline (4h)

- [ ] **T-60** Configurar Service Worker via `next-pwa` (cache do shell da aplicação offline)
- [ ] **T-61** Configurar Dexie.js com schema espelhando entidades: `relatorios_pendentes`, `fotos_pendentes`
- [ ] **T-62** Implementar escrita-em-IndexedDB-primeiro em todas as ações de criar/editar
- [ ] **T-63** Implementar fila de sync (dispara ao `navigator.onLine` voltar a true)
- [ ] **T-64** Detectar conflito de relatório (`updated_at`): preservar ambas versões, setar `conflict_flag`
- [ ] **T-65** Indicador visual de status online/offline no cabeçalho da aplicação

---

## Critérios de Aceite (MVP Completo)

- [ ] Coordenação consegue cadastrar qualquer entidade e acessar todos os dados
- [ ] Prof. AEE consegue cadastrar aluno, vincular Prof. Apoio e criar todos os tipos de relatório
- [ ] Prof. Apoio consegue criar Relatório Anual e enviar foto de aluno vinculado
- [ ] Prof. PI consegue criar Relatório Trimestral e enviar foto de aluno vinculado
- [ ] Transferência de escola revoga acesso da professora anterior corretamente
- [ ] "📸 Registrar Momento" funciona offline em ≤ 3 toques e sincroniza ao reconectar
- [ ] RLS impede vazamento de dados entre papéis (verificado por testes de integração)
- [ ] `docker compose up --build` sobe todo o ambiente sem configuração manual

---

## Adiado para Fase 2

- Interface de diff visual para conflitos de sync
- Notificação automática de transferência de escola
- Editor visual de templates (drag-and-drop)

## Permanentemente Fora do Escopo

- Magic link / autenticação sem senha
- Portal de responsáveis / pais
- Exclusão física de qualquer dado do banco
- Cron de expiração automática de dados LGPD
- Expansão multi-tenant (múltiplas SEMEDs)
