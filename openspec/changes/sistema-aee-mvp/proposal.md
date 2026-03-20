# Proposta: sistema-aee-mvp

## Resumo

Construir o MVP do **Sistema AEE** — uma Progressive Web App para gestão do Atendimento Educacional Especializado em escolas públicas brasileiras.

O sistema atende **quatro perfis de usuário**: Coordenação, Professora AEE, Profissional de Apoio e Professora Regente, cada um com responsabilidades e permissões distintas sobre alunos, relatórios e fotos pedagógicas — tudo funcionando em ambiente com **conectividade intermitente ou inexistente**.

Cada escola possui uma Professora AEE responsável. A Professora AEE pode atuar em mais de uma escola, mas só acessa dados das escolas às quais está vinculada.

---

## Problema

O fluxo atual é fragmentado entre papel, WhatsApp e drives pessoais:

- Sem centralização de fichas de alunos e relatórios
- Fotos pedagógicas sem contexto ou indexação
- Sem visibilidade sobre pendências de relatórios por aluno
- Impossibilidade de trabalhar offline com confiança
- Dados sensíveis de crianças com NEE sem controle de acesso ou trilha de auditoria

---

## Mudança Proposta

Entregar uma PWA offline-first cobrindo:

1. **Quatro perfis de acesso com RBAC**
   - **Coordenação** — cadastra usuários de qualquer tipo; visualiza e comenta todos os dados (relatórios e fichas); NÃO cria nem edita relatórios
   - **Prof. AEE** — cadastra Profissional de Apoio, alunos e todos os tipos de relatório; acessa apenas as escolas às quais está vinculada
   - **Profissional de Apoio** — cria Relatório Anual e faz upload de fotos dos seus alunos
   - **Professora Regente** — cria Relatório Trimestral e faz upload de fotos dos seus alunos

2. **Entidades do domínio**
   - Coordenação, Prof. AEE, Profissional de Apoio, Professora Regente, Aluno
   - Relatório AEE, Relatório Anual, Relatório Trimestral

3. **Gestão do ciclo de vida do aluno** — cadastro, transferência de escola com revogação de acesso, arquivamento soft-delete

4. **Templates de documentos flexíveis** — Relatório AEE (Prof. AEE), Relatório Anual (Prof. AEE ou Profissional de Apoio), Relatório Trimestral (Prof. AEE ou Professora Regente), cada um com seções configuráveis

5. **Captura rápida de foto** ("📸 Registrar Momento") — máximo 3 toques para vincular foto pedagógica a aluno com tag

6. **Sync offline-first** — estratégia de merge por entidade: textos e fotos como unidades independentes

7. **Conformidade LGPD desde zero** — RLS no PostgreSQL, audit log em campos sensíveis, consentimento no cadastro, apenas soft-delete

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Backend | Python (latest), FastAPI (latest), SQLModel (latest), Pydantic v2 |
| Banco | PostgreSQL (produção), SQLite in-memory (testes) |
| Frontend | TypeScript, Next.js (latest) App Router, TailwindCSS, shadcn/ui |
| Auth | NextAuth.js + JWT |
| DevOps | Docker, Docker Compose, GitHub Actions (CI/CD) |
| Testes | pytest (TDD), Playwright (E2E) |
| Offline | next-pwa, Dexie.js (IndexedDB) |

---

## Por que agora

- Decisões arquiteturais finalizadas e aprovadas (PRD v1.1 — 13/03/2026)
- Stack técnica definida: FastAPI + Next.js + PostgreSQL + Docker
- Prazo de 60 horas de desenvolvimento mapeado em 5 fases
- Adiar aumenta a fragmentação de dados e expõe dados sensíveis de crianças sem controle

---

## Fora do Escopo (Esta Change)

### Definitivamente Fora (nunca será implementado)
- Magic link / login sem senha — não fará parte do produto
- Portal de responsáveis / pais (requer fluxo de consentimento ativo fora do controle da escola)
- Exclusão física de dados (LGPD exige apenas soft-delete; DELETE físico nunca deve existir na aplicação)
- BI / relatórios de ocupação e evolução pedagógica agregados — não fará parte do produto
- Autenticação externa (Google OAuth, Office 365) — sem garantias de integração com rede escolar

### Adiado para Fase 2
- Expiração automatizada de dados LGPD (cron de arquivamento após prazo legal)
- Templates dinâmicos editáveis pela Coordenação (editor drag-and-drop)
- Expansão multi-tenant (múltiplas SEMEDs) — arquitetura preparada, mas não executada no MVP

---

## Riscos Conhecidos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Conectividade intermitente em campo | Alto | IndexedDB + Service Worker; sync queue com retry exponencial ao reconectar |
| Conflito de sync (mesma Prof. AEE em dois dispositivos offline) | Baixo | Cenário raro — cada escola tem apenas uma Prof. AEE. Se ocorrer: timestamp comparativo (`updated_at`); versão mais recente prevalece; `conflict_flag: true` exibido na próxima abertura |
| Crescimento de fotos no IndexedDB local | Médio | Compressão antes do upload (max 1MB/foto); alerta ao usuário ao atingir 80% do limite do navegador (≈50MB) |
| Expiração de JWT enquanto offline | Médio | Refresh token armazenado de forma segura; ao reconectar, rotacionar silenciosamente antes do sync |
| LGPD — acesso não autorizado a campos sensíveis | Alto | RLS no PostgreSQL + middleware FastAPI; campos `diagnostico`/`laudo` nunca retornados em listagens; toda leitura auditada em `audit_log` |
| Transferência de escola sem revogação de acesso | Alto | Operação de transferência executa transação atômica: `professor_assignments.data_fim = now()` + nova vinculação + audit_log na mesma transação |

---

## Critérios de Sucesso

- [ ] Coordenação consegue cadastrar usuários de qualquer tipo, visualizar todos os dados e comentar relatórios — mas NÃO cria nem edita relatórios
- [ ] Prof. AEE acessa apenas as escolas às quais está vinculada; consegue cadastrar alunos, Profissional de Apoio e redigir todos os relatórios
- [ ] Profissional de Apoio consegue redigir Relatório Anual e fazer upload de fotos dos seus alunos
- [ ] Professora Regente consegue redigir Relatório Trimestral e fazer upload de fotos dos seus alunos
- [ ] Transferência de escola revoga corretamente o acesso da professora anterior
- [ ] Campos sensíveis não aparecem em exportações gerais; todo acesso é auditado
- [ ] Sync funciona sem perda de dados ao reconectar após edições offline
- [ ] Toda a stack (backend + frontend + banco) sobe com `docker compose up`
