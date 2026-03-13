# Design: sistema-aee-mvp

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        SISTEMA AEE MVP                          │
├─────────────────────────┬───────────────────────────────────────┤
│  FRONTEND (PWA)         │  Next.js 14 App Router + TypeScript   │
│                         │  TailwindCSS + shadcn/ui               │
│                         │  Service Worker (shell offline)        │
│                         │  Dexie.js → IndexedDB (store local)   │
│                         │  @react-pdf/renderer (PDF client-side) │
├─────────────────────────┼───────────────────────────────────────┤
│  BACKEND (REST API)     │  Python 3.12 + FastAPI                 │
│                         │  Pydantic v2 (validação e schemas)     │
│                         │  SQLAlchemy 2 async + Alembic          │
│                         │  JWT (autenticação stateless)          │
├─────────────────────────┼───────────────────────────────────────┤
│  BANCO DE DADOS         │  PostgreSQL 16 com Row-Level Security  │
│                         │  SQLite in-memory (testes pytest)      │
├─────────────────────────┼───────────────────────────────────────┤
│  DEVOPS                 │  Docker + Docker Compose               │
│                         │  GitHub Actions (CI/CD)                │
└─────────────────────────┴───────────────────────────────────────┘
```

---

## Arquitetura Backend: Clean Architecture + DDD

```
backend/
├── domain/            # Entidades, Value Objects, regras puras de negócio
├── application/       # Casos de uso (Use Cases)
├── infrastructure/    # Repositórios, ORM, banco, storage
└── interfaces/        # FastAPI routers, schemas Pydantic (request/response)
```

### Entidades do Domínio

```python
# domain/entities/
Usuario(id, nome, email, papel: Enum[coordenacao|prof_aee|prof_apoio|prof_pi], ativo)
Aluno(id, nome, data_nascimento, escola_atual, historico_escolas[], diagnostico*, responsavel, status)
RelatorioAEE(id, aluno_id, autor_id, conteudo_json, template_snapshot, updated_at, updated_by)
RelatorioAnual(id, aluno_id, autor_id, conteudo_json, template_snapshot, updated_at, updated_by)
RelatorioTrimestral(id, aluno_id, autor_id, conteudo_json, template_snapshot, updated_at, updated_by)
Foto(id, aluno_id, autor_id, url, tag_pedagogica, sync_status, created_at)
VinculoProfessor(id, usuario_id, aluno_id, data_inicio, data_fim?)
AuditLog(id, usuario_id, acao, entidade, campo_sensivel, timestamp)
```
*campo sensível — auditado e nunca exportado em geral*

---

## Modelo de Dados (PostgreSQL)

### Tabelas Principais

```
tenants                   → isolamento multi-tenant (expansão futura)
users                     → todos os usuários (papel armazenado aqui)
schools                   → escolas vinculadas ao tenant
students                  → alunos com campos sensíveis
student_school_history    → histórico de transferências
professor_assignments     → vínculo professor (apoio ou PI) ↔ aluno ↔ período
report_templates          → seções configuráveis (JSONB) por tipo de relatório
reports                   → documentos preenchidos (snapshot do template salvo)
photos                    → registros fotográficos vinculados ao aluno
audit_log                 → acesso a campos sensíveis
```

### Campos Críticos por Entidade

| Entidade | Campos Relevantes |
|---|---|
| `students` | `status: ativo\|arquivado`, `escola_atual_id`, `consentimento_lgpd`, `data_consentimento`, `base_legal` |
| `students` (sensíveis) | `diagnostico`, `laudo` → `sensivel: true` na camada de aplicação |
| `student_school_history` | `escola_id`, `data_inicio`, `data_fim` |
| `professor_assignments` | `usuario_id`, `aluno_id`, `tipo_papel: apoio\|pi`, `data_inicio`, `data_fim` |
| `report_templates` | `tipo: aee\|anual\|trimestral`, `secoes: JSONB[]`, `versao` |
| `reports` | `tipo`, `template_snapshot: JSONB`, `updated_at`, `updated_by` |
| `photos` | `tag: autonomia\|comunicacao\|motor_fino\|socializacao\|outro`, `sync_status: local\|synced` |
| `audit_log` | `user_id`, `student_id`, `field_accessed`, `accessed_at` |

---

## Controle de Acesso (RBAC + RLS)

### Matriz de Permissões

| Recurso | Coordenação | Prof. AEE | Prof. Apoio | Prof. PI |
|---|---|---|---|---|
| Cadastrar usuários (todos) | ✅ | ✅ (só Prof. Apoio) | ❌ | ❌ |
| CRUD Alunos | ✅ | ✅ | ❌ | ❌ |
| Relatório AEE | ✅ | ✅ criar/editar | ❌ | ❌ |
| Relatório Anual | ✅ | ✅ | ✅ (seus alunos) | ❌ |
| Relatório Trimestral | ✅ | ✅ | ❌ | ✅ (seus alunos) |
| Upload de Fotos | ✅ | ✅ | ✅ (seus alunos) | ✅ (seus alunos) |
| Dashboard global | ✅ | ✅ (sua carteira) | ❌ | ❌ |
| Ver campos sensíveis | ✅ | ✅ | ❌ | ❌ |

### Estratégia RLS (PostgreSQL)

```sql
-- Exemplo: tabela students
CREATE POLICY student_access ON students
  USING (
    -- Coordenação vê todos dentro do tenant
    (current_setting('app.role') = 'coordenacao'
      AND tenant_id = current_setting('app.tenant_id')::uuid)
    OR
    -- Prof. AEE vê alunos do seu tenant
    (current_setting('app.role') = 'prof_aee'
      AND tenant_id = current_setting('app.tenant_id')::uuid)
    OR
    -- Prof. Apoio vê apenas alunos atualmente vinculados a ela
    (current_setting('app.role') IN ('prof_apoio', 'prof_pi')
      AND id IN (
        SELECT aluno_id FROM professor_assignments
        WHERE usuario_id = current_setting('app.user_id')::uuid
          AND data_fim IS NULL
      ))
  );
```

Cada request ao backend executa `SET LOCAL app.role`, `SET LOCAL app.user_id` e `SET LOCAL app.tenant_id` antes de qualquer query.

### Middleware FastAPI

```python
# interfaces/middleware/auth.py
def requer_papel(*papeis: Papel):
    """Decorator de autorização por papel."""
    def decorator(func):
        @wraps(func)
        async def wrapper(..., current_user = Depends(get_current_user)):
            if current_user.papel not in papeis:
                raise HTTPException(status_code=403, detail="Acesso não autorizado")
            return await func(...)
        return wrapper
    return decorator
```

---

## Estratégia Offline-First

### Fluxo

```
AÇÃO DO USUÁRIO (offline)
    │
    ▼
IndexedDB (Dexie.js)        ← escrita local imediata
    │
    ▼ (ao reconectar)
Sync Queue Worker           ← Service Worker em background
    │
    ├─► Textos/relatórios   → POST /api/sync/reports   (prioridade 1)
    └─► Fotos               → POST /api/sync/photos    (prioridade 2, background)
    │
    ▼
PostgreSQL                  ← fonte canônica de verdade
```

### Resolução de Conflitos

| Tipo de dado | Estratégia |
|---|---|
| Texto de relatório | Unidade atômica. `updated_at` comparado no sync. Conflito detectado → ambas versões preservadas, `conflict_flag` setado, Prof. AEE notificada |
| Fotos | Sem conflito — cada foto é entidade independente com UUID. Upload idempotente |
| Mudanças administrativas (transferências, vínculos) | Timestamp do servidor prevalece; aplicado no sync com audit trail |

---

## Fluxo "📸 Registrar Momento"

```
[Botão FAB fixo na tela inicial da Prof. AEE / Coordenação]
    │
    ▼
Passo 1: Selecionar ou tirar foto        (file picker nativo / câmera)
    │
    ▼
Passo 2: Selecionar aluno                (autocomplete — máx. 2 toques)
    │
    ▼
Passo 3: Selecionar tag pedagógica       (chips: Autonomia / Comunicação /
    │                                     Motor Fino / Socialização / Outro)
    ▼
[Salvar] → gravado em IndexedDB imediatamente → sincronizado quando online
```

**Máximo: 3 toques do FAB até o registro estar salvo.**

---

## Sistema de Templates de Documentos

```json
{
  "tipo": "relatorio_aee",
  "versao": 2,
  "secoes": [
    { "id": "identificacao",  "label": "Identificação",  "tipo": "texto" },
    { "id": "objetivos",      "label": "Objetivos",      "tipo": "lista" },
    { "id": "estrategias",    "label": "Estratégias",    "tipo": "texto" },
    { "id": "evolucao",       "label": "Evolução",       "tipo": "texto" }
  ]
}
```

Ao salvar um relatório, `template_snapshot` guarda uma cópia congelada da versão do template — alterações futuras nunca retroagem sobre relatórios já emitidos.

---

## Conformidade LGPD

| Requisito | Implementação |
|---|---|
| Base legal | `base_legal: "Art. 58 LDB"` por aluno no cadastro |
| Consentimento | `consentimento_lgpd: bool` + `data_consentimento: timestamp` |
| Auditoria de campos sensíveis | Toda leitura de `diagnostico`, `laudo` grava linha em `audit_log` |
| Isolamento de acesso | PostgreSQL RLS — imposto na camada de banco, não só na aplicação |
| Sem exclusão física | `status: ativo/arquivado`. Nenhum `DELETE` no código da aplicação |
| Política de retenção | Texto estático na tela de privacidade; automação adiada para Fase 3 |
| Criptografia em repouso | Ativada no provedor cloud (PostgreSQL gerenciado) |

---

## Autenticação

- **E-mail + senha** — sem magic links, sem URLs públicas, sem acesso sem senha
- JWT stateless; papel do usuário embutido no token
- Sessão de 8 horas (configurável via variável de ambiente)
- NextAuth.js no frontend; validação/emissão de token no backend FastAPI

---

## UX por Papel

| Interface | Usuário-alvo | Princípio de design |
|---|---|---|
| **Dashboard completo** | Coordenação / Prof. AEE | Multi-escola, desktop-first, responsivo |
| **Visão Apoio** | Prof. Apoio | Wizard passo-a-passo, mobile-first, navegação mínima |
| **Visão PI** | Prof. PI | Igual à Visão Apoio, com acesso ao Relatório Trimestral |

---

## Exportação PDF

- Gerado client-side via `@react-pdf/renderer`
- Seções do template renderizadas como primitivos React-PDF estilizados
- Sem renderização server-side no MVP (evita dependência de Puppeteer)
- Nomenclatura: `[TipoRelatorio]_[NomeAluno]_[Data].pdf`
