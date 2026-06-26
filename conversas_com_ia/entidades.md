# Entidades do Sistema AEE

> Gerado em 27/03/2026 — baseado em `proposal.md` e `design.md` da change `sistema-aee-mvp`

---

## 👤 Usuários e Papéis

| Entidade | Tabela | Descrição |
|---|---|---|
| **Tenant** | `tenants` | Unidade administrativa (SEMED). Todo dado é isolado por tenant |
| **Usuário** | `users` | Qualquer pessoa que faz login; `role` Enum: `coordenacao \| prof_aee \| prof_apoio \| prof_regente` |

---

## 🏫 Escola e Vínculos

| Entidade | Tabela | Descrição |
|---|---|---|
| **Escola** | `schools` | Unidade escolar vinculada a um tenant |
| **VinculoProfessor** | `professor_assignments` | Pivot usuário × escola × aluno. `data_fim` preenchida = acesso revogado. Contém `tipo_papel: apoio \| regente` |
| **HistóricoEscolar** | `student_school_history` | Rastro de todas as escolas que o aluno já frequentou |

---

## 🎒 Aluno

| Entidade | Tabela | Campos críticos |
|---|---|---|
| **Aluno** | `students` | `status: ativo\|arquivado`, `escola_atual_id`, `diagnostico`⚠️, `laudo`⚠️, `consentimento_lgpd`, `data_consentimento`, `base_legal` |

> ⚠️ `diagnostico` e `laudo` são **campos sensíveis** — nunca retornados em listagens gerais; toda leitura grava linha no `audit_log`

---

## 📄 Relatórios

| Entidade | Tabela | Quem pode criar |
|---|---|---|
| **Relatório AEE** | `reports` (`tipo = aee`) | Prof. AEE |
| **Relatório Anual** | `reports` (`tipo = anual`) | Prof. AEE ou Profissional de Apoio |
| **Relatório Trimestral** | `reports` (`tipo = trimestral`) | Prof. AEE ou Professora Regente |
| **Template de Relatório** | `report_templates` | Configuração central com `secoes: JSONB[]` e `versao` |

> Os 3 tipos de relatório compartilham **a mesma tabela `reports`** discriminada pelo campo `tipo`.
> O `template_snapshot` (JSONB congelado) garante que alterações futuras de template não corrompam relatórios já criados.

---

## 📸 Foto Pedagógica

| Entidade | Tabela | Tags disponíveis |
|---|---|---|
| **Foto** | `photos` | `tag: autonomia \| comunicacao \| motor_fino \| socializacao \| outro`, `sync_status: local \| synced` |

---

## 🔒 Auditoria

| Entidade | Tabela | O que registra |
|---|---|---|
| **AuditLog** | `audit_log` | `user_id`, `student_id`, `field_accessed`, `accessed_at` — toda leitura de campo sensível |

---

## Resumo — 10 tabelas

```
tenants
users
schools
students
student_school_history
professor_assignments
report_templates
reports          ← aee | anual | trimestral (discriminador: tipo)
photos
audit_log
```

---

## Decisões de Design

- **3 entidades de domínio de relatório, 1 tabela:** as regras de permissão são diferentes por tipo, mas a persistência é unificada em `reports` com discriminador `tipo`. Simplifica queries, índices e RLS.
- **Soft-delete obrigatório:** nenhuma entidade admite `DELETE` físico (LGPD). Alunos usam `status: arquivado`; vínculos usam `data_fim`.
- **RLS no banco, não só na aplicação:** PostgreSQL Row-Level Security garante isolamento mesmo que o middleware FastAPI seja bypassado.
- **Campos sensíveis isolados:** `diagnostico` e `laudo` nunca aparecem em listagens gerais; acesso individual sempre auditado.
