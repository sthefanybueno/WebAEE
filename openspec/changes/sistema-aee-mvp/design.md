# Design: sistema-aee-mvp

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         SISTEMA AEE MVP                         │
├─────────────────────────┬───────────────────────────────────────┤
│  FRONTEND (PWA)         │  Next.js 14+ App Router               │
│                         │  Service Worker (offline shell)       │
│                         │  Dexie.js → IndexedDB (local store)   │
│                         │  react-pdf (PDF export, client-side)  │
├─────────────────────────┼───────────────────────────────────────┤
│  BACKEND (REST API)     │  Node.js + Fastify  OR  FastAPI        │
│                         │  JWT auth (via NextAuth / Clerk)       │
├─────────────────────────┼───────────────────────────────────────┤
│  DATABASE               │  PostgreSQL with Row-Level Security    │
├─────────────────────────┼───────────────────────────────────────┤
│  FILE STORAGE           │  Cloudflare R2 (photos / PDF exports)  │
├─────────────────────────┼───────────────────────────────────────┤
│  HOSTING                │  Vercel (frontend) + Railway (API)     │
└─────────────────────────┴───────────────────────────────────────┘
```

---

## Data Model

### Core Entities

```
tenants                  → multi-tenant isolation (future SEMED use)
users                    → all users (role stored here)
schools                  → escolas vinculadas a um tenant
students                 → alunos com campos sensíveis
student_school_history   → histórico de transferências
support_assignments      → vínculo prof_apoio ↔ aluno ↔ período
report_templates         → definição de seções (JSON) por tipo
reports                  → documentos preenchidos (snapshot do template)
photos                   → registros fotográficos vinculados ao aluno
audit_log                → acesso a campos sensíveis
```

### Key Field Decisions

| Entity | Notable Fields |
|---|---|
| `students` | `status: ativo\|arquivado`, `escola_atual_id`, `consentimento_lgpd`, `data_consentimento`, `base_legal` |
| `students` (sensitive) | `diagnostico`, `laudo` → flagged `sensivel: true` in app layer |
| `student_school_history` | `escola_id`, `data_inicio`, `data_fim` |
| `support_assignments` | `prof_apoio_id`, `aluno_id`, `data_inicio`, `data_fim` |
| `report_templates` | `tipo: pdi\|atendimento\|periodico\|anual`, `secoes: JSON[]`, `versao` |
| `reports` | `template_snapshot: JSON` (frozen copy of template at time of creation), `updated_at`, `updated_by` |
| `photos` | `tag: autonomia\|comunicacao\|motor_fino\|socializacao\|...`, `sync_status: local\|synced` |
| `audit_log` | `user_id`, `student_id`, `field_accessed`, `accessed_at` |

---

## Access Control

### Role Matrix

| Action | Coordenador | Prof. AEE | Prof. Apoio |
|---|---|---|---|
| Read all students/reports | ✅ (no sensitive fields) | ✅ (own students) | ✅ (assigned only) |
| CRUD students | ❌ | ✅ | ❌ |
| Write PDI / attendance reports | ❌ | ✅ | ❌ |
| Write periodic / annual reports | ❌ | ❌ | ✅ (assigned) |
| Upload photos | ❌ | ✅ | ❌ |
| Register school transfer | ❌ | ✅ | ❌ |
| View sensitive fields (diagnóstico) | ❌ | ✅ | ❌ |
| Manage support teachers | ❌ | ✅ | ❌ |
| Register new Prof. AEE | ✅ | ❌ | ❌ |

### RLS Strategy (PostgreSQL)

```sql
-- Example: students table
CREATE POLICY student_access ON students
  USING (
    -- Prof. AEE sees own students
    (current_role = 'prof_aee' AND tenant_id = current_setting('app.tenant_id')::uuid)
    OR
    -- Prof. Apoio sees only currently assigned students
    (current_role = 'prof_apoio' AND id IN (
      SELECT aluno_id FROM support_assignments
      WHERE prof_apoio_id = current_setting('app.user_id')::uuid
        AND data_fim IS NULL
    ))
    OR
    -- Coordenador sees all within tenant
    (current_role = 'coordenador' AND tenant_id = current_setting('app.tenant_id')::uuid)
  );
```

Every request sets `app.tenant_id` and `app.user_id` and `app.role` in the session before any query executes.

---

## Offline-First Strategy

### Architecture

```
USER ACTION (offline)
    │
    ▼
IndexedDB (Dexie.js)        ← immediate local write
    │
    ▼ (on reconnect)
Sync Queue Worker           ← background Service Worker
    │
    ├─► Text/reports        → POST /api/sync/reports
    └─► Photos              → POST /api/sync/photos (lower priority)
    │
    ▼
PostgreSQL                  ← canonical source of truth
```

### Conflict Resolution

| Data Type | Strategy |
|---|---|
| Report text | Each report = atomic write unit. `updated_at` timestamp compared on sync. Conflict (same report edited on 2 devices) → both versions preserved, conflict flag set, Prof. AEE notified to resolve manually |
| Photos | No conflict possible — each photo is an independent entity with UUID. Upload is idempotent |
| Administrative changes (transfers, assignments) | Server-side timestamp wins; applied on sync with full audit trail |

### Sync Priority

1. Authentication tokens + user metadata
2. Report texts and template definitions
3. Student metadata
4. Photos (background, with progress indicator)

---

## "📸 Registrar Momento" — Quick Capture Flow

```
[Fixed FAB button on Prof. AEE home screen]
    │
    ▼
Step 1: Select or capture photo           (native file picker / camera)
    │
    ▼
Step 2: Select student                    (autocomplete — max 2 taps)
    │
    ▼
Step 3: Select pedagogical tag            (chips: Autonomia / Comunicação /
    │                                      Motor Fino / Socialização / Outro)
    ▼
[Save] → stored in IndexedDB immediately → synced when online
```

Maximum: **3 taps from FAB to saved**.

---

## Document Template System

Templates are stored as JSON arrays of section definitions:

```json
{
  "tipo": "pdi",
  "versao": 3,
  "secoes": [
    { "id": "identificacao", "label": "Identificação", "tipo": "texto" },
    { "id": "diagnostico",   "label": "Diagnóstico",   "tipo": "texto", "sensivel": true },
    { "id": "objetivos",     "label": "Objetivos",     "tipo": "lista" },
    { "id": "estrategias",   "label": "Estratégias",   "tipo": "texto" },
    { "id": "avaliacao",     "label": "Avaliação",     "tipo": "texto" }
  ]
}
```

When a report is saved, `template_snapshot` stores a frozen copy of the template version used — future template edits never retroactively alter existing reports.

---

## LGPD Compliance Implementation

| Requirement | Implementation |
|---|---|
| Basis for processing | `base_legal: "Art. 58 LDB"` stored per student at registration |
| Consent tracking | `consentimento_lgpd: boolean` + `data_consentimento: timestamp` |
| Sensitive field audit | Every read of `diagnostico`, `laudo` writes a row to `audit_log` |
| Access isolation | PostgreSQL RLS — enforced at DB layer, not application layer |
| No permanent deletion | `status: ativo/arquivado` soft delete. No `DELETE` statements allowed in application code |
| Data retention policy | Declared as static text in privacy notice UI; automated expiry deferred to Phase 3 |
| Encryption at rest | Enabled at cloud provider level (Cloudflare R2 + managed PostgreSQL) |

---

## PDF Export

- Generated client-side using `@react-pdf/renderer`
- Template sections rendered as styled React-PDF primitives
- No server-side rendering required in MVP — avoids Puppeteer dependency
- Exported file naming: `[TipoRelatorio]_[NomeAluno]_[Data].pdf`

---

## Authentication

- **Email + password only** — no magic links, no public URLs, no passwordless access
- Session managed by NextAuth (or Clerk) with role stored in JWT
- Session expiry: 8 hours (configurable)
- Role injected into PostgreSQL session on every authenticated request (`SET LOCAL app.role`, `SET LOCAL app.user_id`, `SET LOCAL app.tenant_id`)

---

## UX Split by Role

| Interface | Target user | Key design principle |
|---|---|---|
| **Full dashboard** | Prof. AEE | Feature-rich, multi-school view, desktop-first, responsive |
| **Apoio view** | Prof. Apoio | Step-by-step wizard for report submission, mobile-optimized, minimal navigation |
| **Coordenador view** | Coordenador Geral | Read-only grid of schools + Professoras AEE, no write actions visible |
