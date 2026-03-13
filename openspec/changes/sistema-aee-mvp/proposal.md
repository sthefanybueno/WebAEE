# Proposta: sistema-aee-mvp

## Resumo

Construir o MVP do **Sistema AEE** — uma Progressive Web App para gestão do Atendimento Educacional Especializado em escolas públicas brasileiras.

O sistema atende **quatro perfis de usuário**: Coordenação (acesso livre), Professora AEE (gestora pedagógica), Professora de Apoio e Professora PI, cada um com responsabilidades e permissões distintas sobre alunos, relatórios e fotos pedagógicas — tudo funcionando em ambiente com **conectividade intermitente ou inexistente**.

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
   - **Coordenação** — acesso livre: cadastro de todos os usuários e entidades
   - **Prof. AEE** — cadastra Prof. Apoio, alunos e todos os tipos de relatório
   - **Prof. Apoio** — cadastra Relatório Anual e fotos dos seus alunos
   - **Prof. PI** — cadastra Relatório Trimestral e fotos dos seus alunos

2. **Entidades do domínio**
   - Coordenação, Prof. AEE, Prof. Apoio, Prof. PI, Aluno
   - Relatório AEE, Relatório Anual, Relatório Trimestral

3. **Gestão do ciclo de vida do aluno** — cadastro, transferência de escola com revogação de acesso, arquivamento soft-delete

4. **Templates de documentos flexíveis** — Relatório AEE (Prof. AEE), Relatório Anual (Prof. AEE ou Prof. Apoio), Relatório Trimestral (Prof. AEE ou Prof. PI), cada um com seções configuráveis

5. **Captura rápida de foto** ("📸 Registrar Momento") — máximo 3 toques para vincular foto pedagógica a aluno com tag

6. **Sync offline-first** — estratégia de merge por entidade: textos e fotos como unidades independentes

7. **Conformidade LGPD desde zero** — RLS no PostgreSQL, audit log em campos sensíveis, consentimento no cadastro, apenas soft-delete

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2 (async) |
| Banco | PostgreSQL 16 (produção), SQLite (testes) |
| Frontend | TypeScript, Next.js 14, TailwindCSS, shadcn/ui |
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

- Magic link / login sem senha
- Portal de responsáveis / pais
- Exclusão física de dados
- Expiração automatizada de dados LGPD (cron)
- Expansão multi-tenant (múltiplas SEMEDs)
- Interface de diff visual para conflitos de sync

---

## Critérios de Sucesso

- [ ] Coordenação consegue cadastrar qualquer entidade e acessar todos os dados
- [ ] Prof. AEE consegue cadastrar alunos, Prof. Apoio e redigir todos os relatórios
- [ ] Prof. Apoio consegue redigir Relatório Anual e fazer upload de fotos dos seus alunos
- [ ] Prof. PI consegue redigir Relatório Trimestral e fazer upload de fotos dos seus alunos
- [ ] Transferência de escola revoga corretamente o acesso da professora anterior
- [ ] Campos sensíveis não aparecem em exportações gerais; todo acesso é auditado
- [ ] Sync funciona sem perda de dados ao reconectar após edições offline
- [ ] Toda a stack (backend + frontend + banco) sobe com `docker compose up`
