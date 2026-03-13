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
- [ ] **T-10** Definir entidades de domínio: `Usuario`, `Aluno`, `RelatorioAEE`, `RelatorioAnual`, `RelatorioTrimestral`, `Foto`, `VinculoProfessor`, `AuditLog`
- [ ] **T-11** Definir value objects: `Papel` (coordenacao | prof_aee | prof_apoio | prof_pi), `StatusAluno`, `TagPedagogica`, `TipoRelatorio`
- [ ] **T-12** Implementar regras puras de negócio no domínio (sem dependências de infraestrutura)

### Banco de Dados
- [ ] **T-13** Criar modelos SQLAlchemy: `users`, `schools`, `students`, `student_school_history`
- [ ] **T-14** Criar modelos SQLAlchemy: `professor_assignments` (apoio e PI com campo `tipo_papel`), `report_templates`, `reports`, `photos`, `audit_log`
- [ ] **T-15** Configurar Alembic e criar migration inicial com todas as tabelas
- [ ] **T-16** Implementar RLS no PostgreSQL: políticas para `students`, `reports`, `photos`, `professor_assignments`
- [ ] **T-17** Configurar SQLite in-memory para ambiente de testes (pytest)

### Casos de Uso (TDD — testes antes do código)
- [ ] **T-18** `auth`: login com e-mail/senha, emissão JWT, validação de papel
- [ ] **T-19** `usuarios`: CRUD de todos os papéis; Coordenação cadastra todo mundo; Prof. AEE só cadastra Prof. Apoio
- [ ] **T-20** `alunos`: CRUD, transferência de escola (corte de acesso da prof. anterior), arquivamento
- [ ] **T-21** `relatorios`: criar/editar RelatorioAEE (Prof. AEE), RelatorioAnual (Prof. AEE ou Prof. Apoio), RelatorioTrimestral (Prof. AEE ou Prof. PI); snapshot do template
- [ ] **T-22** `fotos`: upload com tag pedagógica (Coordenação, Prof. AEE, Prof. Apoio, Prof. PI nos seus alunos)
- [ ] **T-23** `dashboard`: query agregada de pendências por aluno (PDI / Rel. Anual / Rel. Trimestral)
- [ ] **T-24** `audit_log`: escrita automática ao acessar campos sensíveis (`diagnostico`, `laudo`)

### API (FastAPI Routers)
- [ ] **T-25** Implementar routers: `/auth`, `/usuarios`, `/alunos`, `/relatorios`, `/fotos`, `/dashboard`
- [ ] **T-26** Middleware de autorização: decorator `@requer_papel([...])` por endpoint
- [ ] **T-27** Middleware de sessão: `SET LOCAL app.role`, `app.user_id`, `app.tenant_id` antes de cada query

---

## Fase 2 — Frontend Core (20h)

### Setup
- [ ] **T-30** Inicializar Next.js 14 com TypeScript, TailwindCSS e shadcn/ui
- [ ] **T-31** Configurar NextAuth com provider e-mail/senha e JWT contendo papel do usuário
- [ ] **T-32** Implementar middleware Next.js de proteção de rotas por papel
- [ ] **T-33** Criar contexto de sessão (`useSession` → expõe `user`, `role`, `tenantId`)

### Layouts por Papel (4 interfaces distintas)
- [ ] **T-34** Layout **Coordenação** — navegação completa, acesso a todas as entidades
- [ ] **T-35** Layout **Prof. AEE** — dashboard multi-escola, navegação completa
- [ ] **T-36** Layout **Prof. Apoio** — wizard simplificado, mobile-first, navegação mínima
- [ ] **T-37** Layout **Prof. PI** — igual ao Apoio, com acesso ao Relatório Trimestral

### Telas Principais
- [ ] **T-38** Tela: Login (e-mail + senha, estados de erro, redirecionamento por papel)
- [ ] **T-39** Tela: Dashboard de pendências (chips verde/vermelho por aluno e tipo de documento)
- [ ] **T-40** Tela: Gestão de Alunos (lista com filtros por escola, cadastro com LGPD)
- [ ] **T-41** Tela: Transferência de escola (fluxo de mudança com revogação de acesso)
- [ ] **T-42** Tela: Formulário de Relatório dinâmico (baseado em template JSON; tipos: AEE, Anual, Trimestral)
- [ ] **T-43** Tela: Galeria de fotos por aluno (grid com filtros por tag pedagógica)
- [ ] **T-44** Componente: FAB "📸 Registrar Momento" (fixo; ≤3 toques; foto → aluno → tag → salvar)
- [ ] **T-45** Componente: Exportação PDF client-side (`@react-pdf/renderer`)

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
