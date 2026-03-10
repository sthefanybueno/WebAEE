# Tasks: sistema-aee-mvp

## Implementation Plan

Estimated total: **8–12 weeks** | Stack: Next.js + Fastify + PostgreSQL + Dexie.js

---

## Phase 0 — Project Setup

- [ ] **T-01** Initialize Next.js 14 project with TypeScript and App Router
- [ ] **T-02** Configure ESLint, Prettier, and Husky pre-commit hooks
- [ ] **T-03** Set up PostgreSQL instance (Railway or local Docker)
- [ ] **T-04** Configure Prisma ORM with initial schema migration
- [ ] **T-05** Set up Cloudflare R2 bucket for photo and PDF storage
- [ ] **T-06** Configure NextAuth with email/password provider and JWT strategy
- [ ] **T-07** Implement role injection middleware (`SET LOCAL app.role`, `app.user_id`, `app.tenant_id` on every request)
- [ ] **T-08** Set up Vitest + React Testing Library for unit/integration tests

---

## Phase 1 — Database Schema & RLS

- [ ] **T-10** Create migration: `tenants`, `users`, `schools` tables with basic constraints
- [ ] **T-11** Create migration: `students` table with `status`, `escola_atual_id`, `consentimento_lgpd`, `data_consentimento`, `base_legal`
- [ ] **T-12** Create migration: `student_school_history` table (`escola_id`, `data_inicio`, `data_fim`)
- [ ] **T-13** Create migration: `support_assignments` table (`prof_apoio_id`, `aluno_id`, `data_inicio`, `data_fim`)
- [ ] **T-14** Create migration: `report_templates` table (`tipo`, `versao`, `secoes: JSONB`)
- [ ] **T-15** Create migration: `reports` table (`template_snapshot: JSONB`, `updated_at`, `updated_by`)
- [ ] **T-16** Create migration: `photos` table (`aluno_id`, `tag`, `storage_key`, `sync_status`)
- [ ] **T-17** Create migration: `audit_log` table (`user_id`, `student_id`, `field_accessed`, `accessed_at`)
- [ ] **T-18** Implement RLS policies for all tables — `students`, `reports`, `photos`, `support_assignments`
- [ ] **T-19** Write integration tests validating RLS isolation between roles

---

## Phase 2 — Authentication & Access Control

- [ ] **T-20** Build login page (email + password, form validation, error states)
- [ ] **T-21** Implement role-based route protection middleware (Next.js middleware)
- [ ] **T-22** Build session context provider (exposes `user`, `role`, `tenantId` to all components)
- [ ] **T-23** Implement session expiry (8h) with auto-logout and toast notification
- [ ] **T-24** Build Coordenador Geral layout shell (read-only navigation)
- [ ] **T-25** Build Prof. AEE layout shell (full dashboard navigation)
- [ ] **T-26** Build Prof. de Apoio layout shell (simplified wizard navigation)

---

## Phase 3 — Student Management

- [ ] **T-30** Build student list page (Prof. AEE — with school filter and pending status chips)
- [ ] **T-31** Build student registration form (with LGPD consent checkbox, base_legal field)
- [ ] **T-32** Build student detail page (tabs: PDI / Attendance / Photos / History)
- [ ] **T-33** Implement `audit_log` write on access to sensitive student fields (`diagnostico`, `laudo`)
- [ ] **T-34** Implement school transfer flow (select new school → sets `data_fim` on current assignment → creates new `student_school_history` entry → revokes `support_assignments` from prior Prof. de Apoio)
- [ ] **T-35** Implement student soft-delete / archive flow (sets `status: arquivado`)
- [ ] **T-36** Build archived students view (filtered list, read-only)

---

## Phase 4 — Support Teacher Management

- [ ] **T-40** Build support teacher list page (Prof. AEE — per school)
- [ ] **T-41** Build support teacher invite / registration flow
- [ ] **T-42** Build student-to-support assignment UI (assign / unassign with date range)
- [ ] **T-43** Implement support assignment period enforcement in RLS queries

---

## Phase 5 — Report Templates & Documents

- [ ] **T-50** Build template editor UI (Prof. AEE — add/remove/reorder sections, section type selection)
- [ ] **T-51** Implement template versioning (new version on each save; old reports retain snapshot)
- [ ] **T-52** Build PDI creation form (driven by template sections JSON)
- [ ] **T-53** Build attendance report creation form (Prof. AEE)
- [ ] **T-54** Build periodic report wizard (Prof. de Apoio — step-by-step, one section per screen)
- [ ] **T-55** Build annual report form (Prof. de Apoio)
- [ ] **T-56** Display `última_edição: {timestamp, nome}` on all report views
- [ ] **T-57** Implement PDF export for any report using `@react-pdf/renderer`
- [ ] **T-58** Upload generated PDF to Cloudflare R2 and provide download link

---

## Phase 6 — Photo Management & Quick Capture

- [ ] **T-60** Build photo gallery per student (grid view with tag filters)
- [ ] **T-61** Build standard photo upload flow (student page → add photo → tag → save)
- [ ] **T-62** Build **"📸 Registrar Momento"** FAB component (fixed position on Prof. AEE home)
- [ ] **T-63** Implement quick capture flow: photo picker → student autocomplete → tag chips → save (≤ 3 taps)
- [ ] **T-64** Persist quick-captured photos to IndexedDB immediately (before upload)
- [ ] **T-65** Sync photos to Cloudflare R2 in background with progress indicator

---

## Phase 7 — Offline-First & Sync

- [ ] **T-70** Configure Next.js Service Worker (next-pwa or Workbox) for offline shell caching
- [ ] **T-71** Set up Dexie.js schema mirroring all key entities (students, reports, photos, templates)
- [ ] **T-72** Implement write-to-IndexedDB-first on all create/edit actions
- [ ] **T-73** Build sync queue worker (fires on `navigator.onLine` event recovery)
- [ ] **T-74** Implement sync priority: metadata first → reports → photos background
- [ ] **T-75** Implement conflict detection on report sync (`updated_at` comparison)
- [ ] **T-76** On conflict detected: preserve both versions, set `conflict_flag`, surface banner for Prof. AEE to resolve manually
- [ ] **T-77** Add online/offline status indicator to app header
- [ ] **T-78** Write offline integration tests (simulate disconnect, edit, reconnect cycle)

---

## Phase 8 — Dashboard & Visibility

- [ ] **T-80** Build pending items dashboard (Prof. AEE — per student chips: PDI ✅/❌, Relatório Apoio ✅/❌, Relatório Anual ✅/❌)
- [ ] **T-81** Add school filter to dashboard
- [ ] **T-82** Add period filter to dashboard (semester / year)
- [ ] **T-83** Build Coordenador Geral overview (schools list → Professoras AEE → students count, read-only)

---

## Phase 9 — LGPD & Privacy

- [ ] **T-90** Add privacy notice text (data retention policy, legal basis) to student registration and app footer
- [ ] **T-91** Verify all sensitive fields are excluded from general list/export queries
- [ ] **T-92** Audit `audit_log` table is being written on every sensitive field access
- [ ] **T-93** Verify no API endpoint returns sensitive fields to Prof. de Apoio or Coordenador roles

---

## Phase 10 — PWA & Production Readiness

- [ ] **T-100** Configure PWA manifest (icons, name, display: standalone, start_url)
- [ ] **T-101** Test PWA install flow on Android Chrome and iOS Safari
- [ ] **T-102** Set up environment variable config (`.env.local`, Railway secrets)
- [ ] **T-103** Set up CI pipeline (GitHub Actions — lint, test, build)
- [ ] **T-104** Configure production deployment (Vercel + Railway)
- [ ] **T-105** End-to-end test: complete offline PDI creation + sync + PDF export cycle
- [ ] **T-106** Security review: validate RLS policies block cross-role and cross-tenant access

---

## Acceptance Criteria (MVP Complete)

- [ ] Valdirene can log in, create a student with LGPD consent, write a PDI offline, and export it as PDF
- [ ] A Professora de Apoio can log in and submit a weekly report from a mobile device
- [ ] A school transfer correctly archives prior access and preserves full history
- [ ] "📸 Registrar Momento" works in ≤ 3 taps and syncs on reconnect
- [ ] RLS prevents any cross-role or cross-tenant data leakage (verified by integration tests)
- [ ] Dashboard shows correct pending status for all students

---

## Deferred to Phase 2

- Visual diff UI for sync conflicts (T-76 covers detection only)
- Automated school transfer notification
- Template visual editor (drag-and-drop)

## Permanently Out of Scope

- Magic link authentication
- Photo uploads by Professoras de Apoio
- Parent / guardian portal
- Physical deletion of any database record
- Automated LGPD data expiry cron job
