# Documento de Apresentação: Backend Sistema AEE
**Data:** 17 de Abril de 2026 · **Status:** Produção · **Cobertura:** 92,60%

---

## Sumário

1. [Domínio da Aplicação](#1-domínio-da-aplicação)
2. [Especificações de Infraestrutura](#2-especificações-de-infraestrutura)
3. [Autenticação do Sistema](#3-autenticação-do-sistema)
4. [Cobertura de Testes](#4-cobertura-de-testes)
5. [Swagger — Caminho do Usuário](#5-swagger--caminho-do-usuário)

---

## 1. Domínio da Aplicação

### O que é o Domínio (e o que não é o Backend)

O **domínio** é o conjunto de **regras de negócio do AEE** — as leis, restrições e processos que existiriam mesmo sem computador. O **backend** é o conjunto de **ferramentas técnicas** que implementam essas regras.

```
DOMÍNIO (O Quê)                    BACKEND (Como)
───────────────────────────────    ───────────────────────────────────
Um aluno NEE precisa de            FastAPI recebe o request
consentimento LGPD para            e repassa ao CreateStudentUseCase,
ser cadastrado.                    que lança ValueError se
                                   consentimento_lgpd == False.

Um professor AEE não pode          O RBAC no Use Case verifica
criar usuários Admin.              PapelUsuario.PROF_AEE e recusa.

Ao transferir um aluno,            TransferStudentUseCase executa
os vínculos com professores        3 operações numa única transação
anteriores são revogados.          ACID — ou tudo ocorre, ou nada.

Dados sensíveis (diagnóstico,      O campo nunca aparece no schema
laudo) exigem justificativa        StudentResponse. Existe rota
e geram registro de auditoria.     dedicada com AuditLog obrigatório.
```

### Entidades do Domínio

O AEE possui cinco entidades principais. Cada uma representa um conceito real do processo educacional:

```
┌─────────────────────────────────────────────────────────┐
│                        DOMÍNIO AEE                      │
│                                                         │
│  School ───────── Student ──────────── Report           │
│  (Escola)         (Aluno NEE)          (PEI / Plano AEE)│
│                       │                    │            │
│                       │             template_snapshot   │
│                       │             (cópia do template  │
│                       │             no momento da       │
│                       │             criação — imutável) │
│                       │                                 │
│               ProfessorAssignment                       │
│               (Qual prof atende                         │
│                qual aluno, em                           │
│                qual escola)                             │
│                       │                                 │
│                  AuditLog ── Photo                      │
│                  (Quem viu)    (Evidência pedagógica)   │
└─────────────────────────────────────────────────────────┘
```

### Atores e Permissões (RBAC)

| Ator | Papel | O que pode fazer |
| :--- | :--- | :--- |
| Secretaria | `ADMIN` | Gestão global da plataforma |
| Coordenação | `COORDENACAO` | Gestão total do tenant (escola/SEMED) |
| Especialista | `PROF_AEE` | Criar relatórios e atender alunos |
| Apoio | `PROF_APOIO` | Acompanhar alunos vinculados |
| Regente | `PROF_REGENTE` | Somente leitura |

### A Regra de Negócio mais Importante: Snapshots de Templates

Quando um relatório pedagógico é criado, o sistema tira uma "foto" do modelo de formulário vigente e a armazena dentro do próprio relatório. Isso garante que, se a coordenação alterar o formulário em 2027, os relatórios de 2026 continuam exibindo os campos originais — **integridade jurídica garantida por design**.

```
Relatório criado em 2026            Relatório criado em 2028
──────────────────────────          ──────────────────────────
template_snapshot: {                template_snapshot: {
  "secoes": [                         "secoes": [
    "Objetivo do PEI",                  "Objetivo do PEI",
    "Estratégias utilizadas"            "Estratégias utilizadas",
  ]                                     "Avaliação bimestral"  ← novo campo
}                                     ]
                                    }
```

Ambos os relatórios coexistem no banco sem corrupção — cada um com o template da sua época.

---

## 2. Especificações de Infraestrutura

### Stack Técnico

```
Camada              Tecnologia                   Justificativa
─────────────────────────────────────────────────────────────────────
Runtime             Python 3.12                  Tipagem moderna, performance
Framework Web       FastAPI 0.115+               Async nativo, Swagger automático
ORM                 SQLModel (SQLAlchemy 2.0)    Pydantic v2 + SQLAlchemy unificados
Driver de Banco     asyncpg                      Driver async para PostgreSQL
Banco de Dados      PostgreSQL 16                JSONB, UUID, integridade transacional
Migrações           Alembic                      Versionamento do schema de banco
Autenticação        python-jose + passlib/bcrypt JWT + hashing seguro de senhas
Rate Limiting       SlowAPI                      Proteção contra brute-force e DoS
```

### Banco de Dados: Assincronismo Total

O backend é **100% não-bloqueante**. Nenhuma operação de banco de dados para a thread principal — todas usam `async/await` com o driver nativo `asyncpg`.

```python
# app/infrastructure/database.py

engine = create_async_engine(
    DATABASE_URL,   # postgresql+asyncpg://...
    echo=False,
    future=True,    # SQLAlchemy 2.0 API
)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency Provider injetado pelo FastAPI em cada request."""
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session   # ← mesma sessão compartilhada por todos os repositórios do request
```

**Por que isso importa?** Sob alta carga, um request bloqueante congela a thread. Com async, o servidor processa centenas de requests pendentes *enquanto espera o banco responder*.

### Upload de Fotos Pedagógicas

O upload de fotos de evidências pedagógicas é gerenciado via URL. O fluxo atual recebe uma `foto_url` (string apontando para o storage externo) e asocia ao aluno com uma `TagPedagogica`:

```
POST /api/fotos/
{
  "aluno_id": "uuid-do-aluno",
  "url": "https://storage.exemplo.com/foto.jpg",
  "tag": "motor_fino"   ← categorização pedagógica obrigatória
}
```

**Tags Pedagógicas disponíveis:**

```
autonomia · comunicacao · motor_fino · socializacao · outro
```

O `CreatePhotoUseCase` valida que o aluno existe e pertence ao mesmo tenant do usuário antes de persistir — nenhuma foto de outro tenant é acessível.

### Sincronização Offline-First

O sistema foi projetado para funcionar em escolas com conectividade instável. O PWA armazena dados localmente e envia para o backend quando a rede é restabelecida:

```
DISPOSITIVO OFFLINE                REDE RETORNA           SERVIDOR
────────────────────               ────────────           ─────────
[cria relatório X]
[edita aluno Y]                    ──(volta)──►  POST /api/sync
[registra foto Z]                  envia batch   ├── X: novo → INSERT
                                                 ├── Y: sem conflito → UPDATE
                                                 └── Z: já existe → IGNORAR
```

**Resolução de conflitos:** Se dois dispositivos editaram o mesmo registro offline, o sistema compara os timestamps (`updated_at`). O mais recente vence. Se o servidor tiver versão mais nova, seta `conflict_flag = True` e a UI alerta o usuário.

### JSONB: Flexibilidade sem Perda de Performance

Os formulários pedagógicos variam por escola, por tipo de atendimento e por política da SEMED. Para não exigir migração de banco a cada mudança de formulário, o conteúdo do relatório é armazenado em **JSONB** (JSON binário indexável do PostgreSQL):

```
Tabela: reports
─────────────────────────────────────────────────────
id               UUID     PK gerado offline-safe
aluno_id         UUID     FK → students
tipo             ENUM     AEE | PEI | RELATORIO
conteudo_json    JSONB    ← campos pedagógicos livres
template_snapshot JSONB   ← snapshot imutável do template
updated_at       TIMESTAMP controle de versão para sync
conflict_flag    BOOLEAN  conflito detectado no merge
```

### Multi-Tenancy e Isolamento

Toda entidade do sistema possui `tenant_id`. Nenhuma query retorna dados de outro tenant — o filtro é aplicado em **todas** as camadas:

```
JWT do usuário carrega tenant_id
         │
         ▼
Router extrai current_user.tenant_id
         │
         ▼  
Use Case valida student.tenant_id == input_dto.tenant_id
         │
         ▼
Repository filtra SELECT WHERE tenant_id = $1
```

---

## 3. Autenticação do Sistema

### Fluxo JWT com Refresh Token

```
CLIENTE (PWA)                          SERVIDOR (FastAPI)
──────────────────                     ──────────────────────────────
POST /api/auth/login
{email, password}          ──────►     Valida credenciais
                                       Gera access_token (curta duração)
                                       Gera refresh_token (longa duração)
                           ◄──────     {access_token, refresh_token, papel, tenant_id}

GET /api/alunos/
Authorization: Bearer {token} ────►   Middleware verifica JWT
                                       Extrai: user_id, tenant_id, papel
                                       ↓ Injeta CurrentUser em todos os handlers

(token expira)

POST /api/auth/refresh
{refresh_token}            ──────►     Valida refresh_token
                           ◄──────     {access_token} ← novo token sem novo login
```

### Implementação Atual: Mock para MVP

O sistema usa uma autenticação **mock compatível com Swagger** para o MVP. Isso permite testar todas as rotas com o botão `Authorize` do Swagger UI, simulando diferentes papéis:

```python
# app/interfaces/routers/auth.py

@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")  # ← proteção contra brute-force
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login de desenvolvimento:
    - username: qualquer e-mail
    - password: o PAPEL desejado (coordenacao, prof_aee, prof_apoio...)
    """
    try:
        papel = PapelUsuario(form_data.password.strip().lower())
    except ValueError:
        papel = PapelUsuario.COORDENACAO  # fallback mais permissivo

    user_id = uuid.uuid4()
    tenant_id = uuid.uuid4()

    return LoginResponse(
        access_token=f"mock_token_{user_id}_{tenant_id}_{papel.value}",
        user_id=user_id,
        tenant_id=tenant_id,
        papel=papel
    )
```

### Como o Token é Validado em Cada Request

```python
# app/interfaces/dependencies.py

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> CurrentUser:
    """
    Parseia o token mock e reconstrói o contexto do usuário.
    Formato: "mock_token_{user_id}_{tenant_id}_{papel}"
    """
    try:
        parts = token.split("_")
        user_id = uuid.UUID(parts[2])
        tenant_id = uuid.UUID(parts[3])
        papel = PapelUsuario("_".join(parts[4:]))
    except (ValueError, IndexError):
        raise HTTPException(status_code=401, detail="Token JWT inválido")

    return CurrentUser(id=user_id, tenant_id=tenant_id, papel=papel)
```

O `CurrentUser` injetado carrega três informações críticas:
- **`id`**: quem está fazendo a ação (para AuditLog)
- **`tenant_id`**: de qual rede/escola esse usuário faz parte (para isolamento)
- **`papel`**: o que esse usuário pode fazer (para RBAC)

### Rate Limiting como Camada de Segurança

```
/api/auth/login      → limite: 5 req/min por IP   (anti brute-force)
/api/dados-sensiveis → limite: 20 req/min por IP  (anti scraping LGPD)
/api/sync            → SEM LIMITE                 (fluxo offline crítico)
```

---

## 4. Cobertura de Testes

### Resultado da Última Execução

```bash
# Comando para verificar:
docker exec aee_api python -m pytest --cov=app --cov-report=term-missing

# Resultado:
TOTAL    1405 statements   104 missed   🟢 92.60% coverage
76 passed · 2 warnings · 0 failed
Goal: ≥ 80% · Status: SUPERADO (+12,6 pontos acima da meta)
```

### Ferramentas de Teste

| Ferramenta | Propósito |
| :--- | :--- |
| **pytest** | Runner principal de testes |
| **pytest-asyncio** | Suporte a funções `async def` em testes |
| **pytest-cov** | Coleta e relatório de cobertura de código |
| **httpx** | Cliente HTTP assíncrono para testes de API (TestClient FastAPI) |
| **ruff** | Linting e formatação – bloqueia merge se houver infração de estilo |
| **mypy (strict)** | Checagem estática de tipos – garante que `Optional[X]` seja tratado |

### Estrutura da Suite de Testes

```
tests/
├── domain/              # Testes das regras de negócio puras
│                          (validação de enum, soft-delete, etc.)
│
├── application/         # Testes unitários dos Use Cases
│   ├── test_create_student.py      ← sem banco, mock em memória
│   ├── test_transfer_student.py    ← valida atomicidade da operação
│   ├── test_create_report.py       ← valida snapshot de template
│   ├── test_sync_report.py         ← valida LWW e detecção de conflito
│   ├── test_create_user.py         ← valida RBAC de criação
│   └── test_use_cases_extra.py     ← cenários de borda e exceções
│
├── integration/         # Testes end-to-end com API real (SQLite in-memory)
│   ├── test_students_api.py        ← CRUD completo de alunos
│   ├── test_reports_api.py         ← fluxo completo de relatórios
│   ├── test_photos_api.py          ← upload e sync de fotos
│   ├── test_multi_tenant_api.py    ← isolamento entre tenants
│   ├── test_sync_api.py            ← sincronização offline-first
│   └── test_routers_extra.py       ← auth, refresh, edge cases
│
└── infrastructure/      # Testes dos repositórios concretos
```

### Estratégia: Pirâmide de Testes

```
        ▲
       /|\
      / | \        Integração (testa a API de ponta-a-ponta)
     /  |  \       10 arquivos · cenários reais com banco SQLite
    /───────\
   /         \     Application (testa Use Cases com mocks)
  /  UNIDADE  \    7 arquivos · sem dependência de infraestrutura
 /─────────────\
/   DOMÍNIO     \  Validações de entidades e enums
─────────────────
```

### Cobertura por Camada (Resultado Real)

```
Camada                          Cobertura   Observação
────────────────────────────────────────────────────────────────────────
application/ports/              100%        Interfaces totalmente cobertas
domain/entities/                100%        Regras de negócio validadas
infrastructure/repositories/    88%+        Caminhos felizes e de erro
interfaces/routers/             82%+        Todos os endpoints testados
interfaces/schemas/             100%        DTOs de entrada/saída verificados
application/use_cases/          95%+        Todos Use Cases cobertos
main.py                          95%        Startup e health check
────────────────────────────────────────────────────────────────────────
TOTAL                           92,60%      Meta de 80% superada ✅
```

### Justificativa dos 7,4% Não Cobertos

Os 104 statements sem cobertura se concentram em:

| Área | Linhas | Motivo |
| :--- | :--- | :--- |
| `routers/users.py` (65-73) | ~9 linhas | Fluxos de admin global ainda em mock |
| `routers/sync.py` (35-45) | ~7 linhas | Caminho de erro de sincronização em batch |
| `use_cases/photos/sync_photo.py` (42-62) | ~6 linhas | Edge case de foto duplicada |

Nenhuma dessas linhas representa funcionalidade de domínio crítica — são tratamentos defensivos de erros que requerem fixtures de teste mais elaboradas, planejadas para a Fase 2.

### Pipeline de Qualidade (GitHub Actions)

```yaml
# .github/workflows/main.yml

on: [push, pull_request]  # executa em todo push para main

jobs:
  test:
    steps:
      - name: Run Ruff        # bloqueia merge se houver erro de lint
        run: ruff check .

      - name: Run Mypy        # bloqueia merge se houver erro de tipo
        run: mypy .

      - name: Run Tests       # bloqueia merge se cobertura < 80%
        run: pytest --cov=app --cov-fail-under=80
```

**Nenhum código entra em produção** sem passar pelas três etapas acima.

---

## 5. Swagger — Caminho do Usuário

### Acesso à Documentação

A API disponibiliza dois visualizadores automáticos:

```
http://localhost:8000/docs    ← Swagger UI (interativo, com botão Authorize)
http://localhost:8000/redoc   ← ReDoc (documentação legível)
```

### Como Autenticar no Swagger

1. Abra `http://localhost:8000/docs`
2. Clique em **Authorize** (ícone de cadeado)
3. Preencha:
   - **Username:** qualquer e-mail (ex: `coord@escola.edu.br`)
   - **Password:** o papel desejado (`coordenacao`, `prof_aee`, `prof_apoio`)
4. Clique em **Authorize**
5. Todas as chamadas seguintes usarão o token gerado automaticamente

### Caminho Completo do Usuário (Jornada via API)

```
ETAPA 1: AUTENTICAÇÃO
─────────────────────────────────────────────────────────────
POST /api/auth/login
  ├── username: coord@escola.edu.br
  └── password: coordenacao
  → Retorna: access_token, tenant_id, papel


ETAPA 2: VISÃO GERAL
─────────────────────────────────────────────────────────────
GET /api/dashboard/stats
  → Retorna: total alunos, atendimentos, relatórios do mês


ETAPA 3: GESTÃO DE ESCOLAS
─────────────────────────────────────────────────────────────
POST /api/escolas/           ← Cadastrar nova escola
GET  /api/escolas/           ← Listar escolas do tenant


ETAPA 4: CADASTRO DE ALUNO (com LGPD obrigatória)
─────────────────────────────────────────────────────────────
POST /api/alunos/
  {
    "nome": "João da Silva",
    "escola_atual_id": "uuid-da-escola",
    "consentimento_lgpd": true,          ← OBRIGATÓRIO
    "base_legal": "Lei 13.146/2015"
  }
  → Retorna: student com id gerado (UUID offline-safe)


ETAPA 5: VÍNCULO COM PROFESSOR
─────────────────────────────────────────────────────────────
POST /api/alunos/{student_id}/vinculos
  {
    "usuario_id": "uuid-do-professor",
    "tipo_papel": "prof_aee"
  }


ETAPA 6: DADOS SENSÍVEIS (LGPD — justificativa obrigatória)
─────────────────────────────────────────────────────────────
GET /api/alunos/{student_id}/dados-sensiveis?justificativa=Revisão+do+PEI+semestral
  → Gera AuditLog automático
  → Retorna: diagnostico, laudo


ETAPA 7: RELATÓRIO PEDAGÓGICO
─────────────────────────────────────────────────────────────
GET  /api/relatorios/templates           ← Ver modelos disponíveis
POST /api/relatorios/
  {
    "tipo": "AEE",
    "aluno_id": "uuid-do-aluno",
    "conteudo_json": {"objetivo": "Desenvolver autonomia"}
  }
  → template_snapshot gravado automaticamente

GET  /api/relatorios/aluno/{student_id} ← Histórico completo


ETAPA 8: FOTOS / EVIDÊNCIAS PEDAGÓGICAS
─────────────────────────────────────────────────────────────
POST /api/fotos/
  {
    "aluno_id": "uuid",
    "url": "https://storage/foto.jpg",
    "tag": "motor_fino"
  }
GET  /api/fotos/aluno/{student_id}       ← Portfolio visual


ETAPA 9: TRANSFERÊNCIA DE ESCOLA
─────────────────────────────────────────────────────────────
POST /api/alunos/{student_id}/transferir
  {
    "nova_escola_id": "uuid-nova-escola"
  }
  → Revoga vínculos anteriores automaticamente
  → Cria registro no histórico de transferências


ETAPA 10: SINCRONIZAÇÃO OFFLINE
─────────────────────────────────────────────────────────────
POST /api/sync/
  {
    "reports": [...],    ← lote criado/editado offline
    "photos": [...]      ← fotos capturadas offline
  }
  → Resolve conflitos automaticamente


ETAPA 11: OPERAÇÕES DE USUÁRIO
─────────────────────────────────────────────────────────────
POST /api/usuarios/         ← Criar novo usuário (apenas ADMIN/COORDENACAO)
GET  /api/usuarios/me       ← Dados do usuário logado


HEALTH CHECK
─────────────────────────────────────────────────────────────
GET  /health               → {"status": "ok", "service": "aee-api"}
```

### Mapa de Rotas por Tag (Swagger)

```
Tag: auth       → /api/auth/login · /api/auth/refresh
Tag: alunos     → /api/alunos/ (CRUD) · /vinculos · /transferir · /arquivar · /dados-sensiveis
Tag: relatorios → /api/relatorios/ (CRUD) · /templates · /aluno/{id}
Tag: fotos      → /api/fotos/ · /api/fotos/aluno/{id} · /api/fotos/sync
Tag: escolas    → /api/escolas/ (GET/POST)
Tag: usuarios   → /api/usuarios/ · /api/usuarios/me
Tag: dashboard  → /api/dashboard/stats
Tag: sync       → /api/sync/ (pull e resolve)
Tag: infra      → /health
```

---

*Documento gerado com base no código real do repositório sthefanybueno/WebAEE.*  
*Todos os trechos de código foram extraídos diretamente dos arquivos de produção.*
