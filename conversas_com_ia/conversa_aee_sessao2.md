# 💬 Conversa — Sistema AEE (Sessão 2 — Aprofundamento e PRD Final)
**Data:** 10/03/2026  
**Participantes:** Usuário + Antigravity (AI)  
**Base:** `conversa_aee_arquitetura.md` (Sessão 1 — 06/03/2026)

---

## 📌 Ponto de Partida

A sessão anterior definiu a arquitetura base do Sistema AEE:
- PWA Offline-First (Next.js + IndexedDB/Dexie.js)
- Dois papéis: Prof. AEE (admin) e Prof. de Apoio (acesso limitado)
- Templates flexíveis de relatório (PDI, relatório de apoio)
- Upload de fotos vinculadas ao aluno
- PostgreSQL + RLS + multi-tenant futuro

---

## 🌳 Etapa 1 — Análise Tree-of-Thought

**Usuário:**
> Aja como um Product Manager Sênior e Especialista em UX. Use a técnica de Exploração em Árvore (Tree-of-Thought) para analisar nosso escopo atual sob 3 perspectivas:
> 1. Jornada do Usuário (Edge Cases)
> 2. Funcionalidades Ocultas (Low-Hanging Fruits)
> 3. Riscos de Negócio e LGPD
>
> Para cada perspectiva: ramifique 2-3 caminhos, faça autoavaliação de impacto vs complexidade (1-10) e descarte os ramos menos promissores.

---

### AI — Perspectiva 1: Edge Cases da Jornada do Usuário

**Ramo 1.A — Conflito de Sincronização Offline**

Cenário: Valdirene edita o PDI offline no notebook enquanto a Prof. de Apoio carrega foto no celular também offline. Ao reconectar, o que vence?

| Abordagem | Impacto | Complexidade | Decisão |
|---|---|---|---|
| Last-Write-Wins | 4 | 2 | ❌ Descartado — risco de perda silenciosa de dado pedagógico |
| **Merge por entidade separada** (textos ≠ fotos) | **8** | 5 | ✅ **MVP** |
| Fila de conflitos com diff visual | 9 | 8 | 🔶 Fase 2 |

**Ramo 1.B — Professora de Apoio sem familiaridade digital**

Cenário: Professora de 55 anos, celular pessoal, 3G, nunca usou sistema web.

| Abordagem | Impacto | Complexidade | Decisão |
|---|---|---|---|
| **UX "modo apoio"** — wizard com 1 campo por tela | **9** | 4 | ✅ **MVP** |
| Magic link (login sem senha) | 7 | 3 | ❌ **Descartado** — dados sensíveis exigem autenticação forte |

**Ramo 1.C — Troca de Escola no Meio do Ano**

Cenário: Aluno transferido — acesso da Prof. de Apoio anterior deve ser cortado; histórico deve ser preservado.

| Abordagem | Impacto | Complexidade | Decisão |
|---|---|---|---|
| **Transferência com corte de acesso por período** | **9** | 4 | ✅ **MVP** |
| **Histórico imutável (relatórios arquivados)** | 9 | 3 | ✅ **MVP** |
| Notificação automática | 7 | 5 | 🔶 Fase 2 |

---

### AI — Perspectiva 2: Low-Hanging Fruits

**Ramo 2.A — "📸 Registrar Momento" (Captura Rápida)**
- Botão fixo na tela inicial, máx. 3 toques até a foto estar salva com tag pedagógica
- Impacto: **9/10** | Complexidade: **3/10** → ✅ **MVP aprovado**

**Ramo 2.B — "Última edição por [nome]" em relatórios**
- Campo `updated_at` + `updated_by` visível em todos os documentos
- Impacto: **8/10** | Complexidade: **1/10** → ✅ **MVP aprovado**

**Ramo 2.C — Dashboard de pendências por aluno**
- Verde/vermelho por tipo de documento (PDI / Relatório Apoio / Relatório Anual)
- Impacto: **9/10** | Complexidade: **4/10** → ✅ **MVP aprovado**

---

### AI — Perspectiva 3: Riscos LGPD

**Ramo 3.A — Acesso indevido a dados sensíveis**

| Medida | Impacto | Complexidade | Decisão |
|---|---|---|---|
| **RLS no PostgreSQL** | 10 | 4 | ✅ **MVP — não negociável** |
| **Log de acesso a campos sensíveis** | 9 | 3 | ✅ **MVP** |
| **Campos `sensivel: true`** | 8 | 3 | ✅ **MVP** |

**Ramo 3.B — Ausência de base legal / consentimento**

| Medida | Impacto | Complexidade | Decisão |
|---|---|---|---|
| **Checkbox de consentimento no cadastro** | 9 | 2 | ✅ **MVP** |
| **Base legal declarada: Art. 58 LDB** | 8 | 2 | ✅ **MVP** |
| Portal do Responsável | 7 | 8 | 🔶 Fase 3 |

**Ramo 3.C — Retenção e exclusão de dados**

| Medida | Impacto | Complexidade | Decisão |
|---|---|---|---|
| **Política de retenção declarada** (texto estático) | 8 | 2 | ✅ **MVP** |
| **Soft delete** (`status: ativo | arquivado`) | 7 | 2 | ✅ **MVP** |
| Exclusão automatizada por cron | 7 | 6 | 🔶 Fase 3 |

> **Arquivo gerado:** `aee_tree_of_thought.md`

---

## 📋 Etapa 2 — PRD Final (Document de Requisitos)

**Usuário:**
> Aja como Arquiteto de Software Sênior e Product Manager. Redija o Documento de Requisitos e Proposta Arquitetural Final para o "Sistema AEE".
>
> **Regras inegociáveis:**
> - Hierarquia: Coordenador Geral > Prof. AEE > Prof. de Apoio
> - Sem magic link — autenticação por senha forte
> - Sem exclusão física — apenas soft delete/arquivamento
> - Pais sem acesso ao sistema
> - RLS obrigatório no MVP
> - "📸 Registrar Momento" aprovado para o MVP
> - Upload de foto exclusivo da Prof. AEE

---

### Checklist de auto-revisão (AI, antes de gerar)

| Regra | Verificação |
|---|---|
| Hierarquia Coordenador > Prof. AEE > Apoio | ✅ |
| Magic link proibido | ✅ |
| Sem exclusão física | ✅ |
| Pais sem acesso | ✅ |
| RLS no MVP | ✅ |
| "📸 Registrar Momento" no MVP | ✅ |
| Fotos exclusivas da Prof. AEE | ✅ |

---

### Decisões Consolidadas no PRD

**Stack técnica aprovada:**

| Camada | Tecnologia |
|---|---|
| Frontend (PWA) | Next.js + Service Worker |
| Cache offline | Dexie.js (IndexedDB) |
| Backend | Node.js (Fastify) ou FastAPI |
| Banco | PostgreSQL + RLS |
| Fotos | Cloudflare R2 (ou AWS S3) |
| Auth | NextAuth ou Clerk |
| PDF | react-pdf (client-side) |
| Hospedagem | Vercel + Railway/Render |

**Módulos descartados definitivamente:**

| Módulo | Motivo |
|---|---|
| Magic link / login sem senha | Dados sensíveis de menores com NEE |
| Upload de fotos pela Prof. de Apoio | Exclusividade pedagógica da Prof. AEE |
| Portal do Responsável / Acesso dos Pais | Fora do escopo de todas as fases |
| Exclusão física de dados | Obrigação legal de manutenção de histórico |
| Notificação automática de transferência | Fase 2 |
| Interface de diff para conflitos de sync | Fase 2 |
| Exclusão automatizada de dados por cron | Fase 3 |

**Fases de desenvolvimento:**

| Fase | Foco | Estimativa |
|---|---|---|
| Fase 1 — MVP | Tudo listado no PRD | 8–12 semanas |
| Fase 2 — Consolidação | Diff visual, notificações, editor visual de templates | 4–6 semanas |
| Fase 3 — Escala | Multi-tenant, SEMED, exclusão automatizada LGPD | 6–8 semanas |

> **Arquivo gerado:** `aee_prd_final.md`  
> **Status do usuário:** ✅ **LGTM — Aprovado**

---

## 📁 Artefatos Produzidos nesta Sessão

| Arquivo | Descrição |
|---|---|
| `aee_tree_of_thought.md` | Análise Tree-of-Thought com 3 perspectivas e matriz de priorização |
| `aee_prd_final.md` | Documento de Requisitos e Proposta Arquitetural Final (aprovado) |
| `conversa_aee_sessao2.md` | Este arquivo — registro desta sessão |

---

## ➡️ Próximos Passos Sugeridos

1. **Schema do banco de dados** — tabelas PostgreSQL, campos sensíveis, RLS, `audit_log`
2. **Modelagem de dados** — entidades, relacionamentos, índices
3. **Definição da API** — endpoints por papel, contratos de entrada/saída

---

*Sessão 2 — Sistema AEE — 10/03/2026*  
*Continuação de `conversa_aee_arquitetura.md` (Sessão 1 — 06/03/2026)*
