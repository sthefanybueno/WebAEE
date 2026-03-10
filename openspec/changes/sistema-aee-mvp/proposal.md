# Proposal: sistema-aee-mvp

## Summary

Build the MVP of the **Sistema AEE** — a Progressive Web App for managing Special Educational Needs (AEE) attendance in Brazilian public schools.

The system serves **Professora AEE Valdirene**, who coordinates special education across 3 schools, managing students with NEE, support teachers (Professoras de Apoio), pedagogical reports, and photo documentation — all in an environment with **unreliable Wi-Fi connectivity**.

---

## Problem

Currently, Valdirene's workflow is fragmented across paper, WhatsApp, and personal cloud drives:

- No centralized place for student records, PDIs, and reports
- Photos have no pedagogical context or indexing
- No visibility into whether support teachers have submitted their reports
- Cannot work reliably without internet — schools have intermittent connectivity
- Sensitive data (medical diagnoses, special needs assessments) handled with no access control or audit trail

---

## Proposed Change

Deliver a fully functional offline-first PWA covering:

1. **Three-tier access control** — Coordenador Geral (read-only), Professora AEE (full admin of her ecosystem), Professora de Apoio (restricted to assigned students)
2. **Student lifecycle management** — cadastro, school transfers with access revocation, soft-delete archiving
3. **Flexible document templates** — PDI, attendance reports, support teacher reports (weekly/monthly/annual), each with independent configurable sections
4. **Quick photo capture** ("📸 Registrar Momento") — max 3 taps to link a pedagogical photo to a student with a tag
5. **Offline-first sync** — entity-level merge strategy: texts and photos treated as independent units to prevent critical conflicts
6. **LGPD compliance from day zero** — RLS in PostgreSQL, audit log on sensitive fields, consent recorded at student registration, soft-delete only

---

## Why Now

- Valdirene is the immediate beneficiary and first real user — the system solves an active daily pain
- Architecture decisions are finalized and approved (PRD v1.0 — 10/03/2026)
- The MVP scope is well-bounded and achievable in 8–12 weeks
- Deferring implementation risks further data fragmentation and potential LGPD exposure with sensitive minor data

---

## Out of Scope (This Change)

- Magic link / passwordless login
- Photo uploads by Professoras de Apoio
- Parent/guardian portal or access
- Physical deletion of any data
- Automated LGPD data expiry (cron)
- Multi-tenant expansion (multiple SEMEDs)
- Visual conflict diff UI for offline sync

---

## Success Criteria

- [ ] All three user roles can log in and access only their authorized data
- [ ] Valdirene can create a PDI, attach photos, and export to PDF — entirely offline
- [ ] A Professora de Apoio can submit a periodic report from a mobile device
- [ ] Student school transfer correctly revokes prior support teacher access
- [ ] Sensitive fields are not exposed in general exports; all access is logged
- [ ] Sync resolves without data loss when reconnecting after offline edits
