# 📚 Sistema AEE — Guia de Desenvolvimento

Passo a passo completo desde ligar o ambiente até usar a API.

---

## 📋 Pré-requisitos

Ter instalado na máquina:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (com Docker Compose)
- Um navegador (Chrome, Edge, etc.)

---

## 🚀 PASSO 1 — Ligar o Ambiente

### 1.1 Abrir o terminal na pasta do projeto

No Windows Explorer, navegue até:
```
C:\Sistemas\WebAEE
```

Clique com botão direito → **"Abrir no Terminal"** (ou abra o PowerShell e digite):
```powershell
cd C:\Sistemas\WebAEE
```

### 1.2 Subir todos os serviços com Docker

```powershell
docker compose up -d
```

> ⏳ Na primeira vez pode demorar alguns minutos para baixar as imagens.

### 1.3 Verificar se tudo subiu corretamente

```powershell
docker compose ps
```

Você deve ver **4 serviços** com status `running`:

| Serviço   | O que é                        | Porta       |
|-----------|-------------------------------|-------------|
| `api`     | Backend FastAPI (Python)       | 8000        |
| `db`      | Banco de dados PostgreSQL      | 5432        |
| `pgadmin` | Interface visual do banco      | 5050        |
| `redis`   | Cache (se configurado)         | 6379        |

---

## 🌐 PASSO 2 — Acessar os Serviços

Abra o navegador e acesse:

| O que | URL | Para que serve |
|---|---|---|
| **API / Swagger** | http://localhost:8000/docs | Testar todos os endpoints |
| **pgAdmin** | http://localhost:5050 | Ver e consultar o banco de dados |
| **Health Check** | http://localhost:8000/health | Confirmar que a API está viva |

---

## 🔑 PASSO 3 — Fazer Login na API (Swagger)

1. Acesse **http://localhost:8000/docs**
2. Clique no botão verde **"Authorize"** 🔓 (canto superior direito)
3. Preencha:
   - **Username:** `admin` *(ou qualquer coisa)*
   - **Password:** `admin` ← **este campo define seu papel!**
4. Clique em **"Authorize"** → depois **"Close"**

> O cadeado vai fechar 🔒 — você está logado como **Admin**!

### Papéis disponíveis no campo "Password":

| Digite no Password | Papel | Permissões |
|---|---|---|
| `admin` | Administrador | Acesso total, cria qualquer usuário |
| `coordenacao` | Coordenador | Gerencia escola, cria usuários |
| `prof_aee` | Prof. AEE | Cria relatórios, vincula alunos |
| `prof_apoio` | Prof. Apoio | Lê dados, acompanha alunos |
| `prof_regente` | Prof. Regente | Somente leitura |

---

## 🏫 PASSO 4 — Criar uma Escola

No Swagger, vá em **`POST /api/escolas/`**:

1. Clique em **"Try it out"**
2. Use o payload:
```json
{
  "nome": "Escola Municipal João Silva"
}
```
3. Clique em **"Execute"**
4. Resposta esperada: **201 ✅**
5. **Copie o `id`** retornado — você vai precisar dele!

```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "nome": "Escola Municipal João Silva",
  "tenant_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "ativo": true
}
```

---

## 👤 PASSO 5 — Criar um Usuário

No Swagger, vá em **`POST /api/usuarios/`**:

1. Clique em **"Try it out"**
2. Use o payload:
```json
{
  "email": "coordenadora@escola.edu.br",
  "nome": "Ana Coordenadora",
  "papel": "coordenacao",
  "escola_ids": []
}
```
3. Clique em **"Execute"**
4. Resposta esperada: **201 ✅**

> ⚠️ **Regra importante:** Você só pode criar usuários de papéis iguais ou menores ao seu.
> Para criar qualquer papel, logue como `admin`.

---

## 🎓 PASSO 6 — Cadastrar um Aluno

No Swagger, vá em **`POST /api/alunos/`**:

1. Clique em **"Try it out"**
2. Use o payload (coloque o `id` da escola criada no Passo 4):
```json
{
  "nome": "Maria da Silva",
  "escola_atual_id": "ID-DA-ESCOLA-AQUI",
  "consentimento_lgpd": true,
  "data_nascimento": "2015-06-10T00:00:00.000Z",
  "diagnostico": "TDAH",
  "laudo": "Laudo neurológico",
  "base_legal": "Art. 58 LDB"
}
```
3. Clique em **"Execute"**
4. Resposta esperada: **201 ✅**

> 🔒 **LGPD:** Os campos `diagnostico` e `laudo` **nunca aparecem** em listagens gerais.
> Só são acessíveis via `GET /api/alunos/{id}/dados-sensiveis` (com auditoria automática).

---

## 🗄️ PASSO 7 — Conferir o Banco de Dados (pgAdmin)

### 7.1 Acessar o pgAdmin

1. Abra **http://localhost:5050**
2. Login:
   - **Email:** `admin@webaee.com`
   - **Senha:** `admin`

### 7.2 Conectar ao banco

No painel esquerdo:
```
Servers → Postgres WebAEE → Databases → aee_db → Schemas → public → Tables
```

### 7.3 Ver dados de uma tabela

1. Clique com **botão direito** na tabela (ex: `students`)
2. Selecione **"View/Edit Data"** → **"All Rows"**
3. Os dados aparecem na parte inferior

### 7.4 Rodar uma query SQL personalizada

1. Menu superior: **Tools → Query Tool** (ou `Alt+Shift+Q`)
2. Digite a query e pressione **F5**

**Queries úteis:**
```sql
-- Ver todos os alunos ativos
SELECT id, nome, status, created_at FROM students WHERE status = 'ATIVO';

-- Ver todas as escolas por tenant
SELECT nome, tenant_id, ativo FROM schools ORDER BY nome;

-- Ver log de auditoria LGPD
SELECT user_id, student_id, field_accessed, accessed_at FROM audit_log ORDER BY accessed_at DESC;

-- Ver usuários cadastrados
SELECT nome, email, papel, ativo FROM users;

-- Contar registros por tabela
SELECT 'students' as tabela, COUNT(*) FROM students
UNION ALL SELECT 'schools', COUNT(*) FROM schools
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'audit_log', COUNT(*) FROM audit_log;
```

---

## 🧪 PASSO 8 — Rodar os Testes Automatizados

### Testes unitários (pytest):
```powershell
docker compose exec api pytest tests/ -v
```

### Fuzzer — testa todos os endpoints contra erros 500:
```powershell
docker compose exec api python test_all_endpoints.py
```

> ✅ Resultado esperado: `ZERO erros 500 em todos os endpoints!`

---

## ⚙️ Comandos úteis do dia a dia

```powershell
# Ligar tudo
docker compose up -d

# Desligar tudo (mantém os dados)
docker compose down

# Desligar e APAGAR o banco (cuidado!)
docker compose down -v

# Ver logs da API em tempo real
docker compose logs -f api

# Ver logs do banco
docker compose logs -f db

# Acessar o terminal da API
docker compose exec api bash

# Rodar migration do banco manualmente
docker compose exec api alembic upgrade head

# Verificar tabelas no banco (terminal rápido)
docker compose exec db psql -U aee_user -d aee_db -P pager=off -c "\dt"
```

---

## 📊 Estado Atual do Banco de Dados

| Tabela | Registros | Descrição |
|---|---|---|
| `students` | ~45 | Alunos com NEE |
| `schools` | ~52 | Escolas vinculadas |
| `audit_log` | ~24 | Log de acessos LGPD |
| `users` | 0 | Aguarda dados reais |
| `tenants` | 0 | Aguarda dados reais |
| `reports` | 0 | Aguarda relatórios |

---

## 🗺️ Mapa de Endpoints da API

| Método | Rota | O que faz |
|---|---|---|
| `POST` | `/api/auth/login` | Login → gera token |
| `POST` | `/api/auth/refresh` | Renova token (PWA) |
| `GET` | `/api/usuarios/me` | Meu perfil |
| `GET/POST` | `/api/usuarios/` | Listar / Criar usuários |
| `GET/POST` | `/api/escolas/` | Listar / Criar escolas |
| `POST` | `/api/alunos/` | Cadastrar aluno |
| `GET` | `/api/alunos/` | Listar alunos (sem dados sensíveis) |
| `GET` | `/api/alunos/{id}` | Detalhe do aluno |
| `PUT` | `/api/alunos/{id}` | Atualizar aluno |
| `GET` | `/api/alunos/{id}/dados-sensiveis` | Diagnóstico + Laudo (auditado) |
| `POST` | `/api/alunos/{id}/arquivar` | Soft-delete do aluno |
| `POST` | `/api/alunos/{id}/transferir` | Transferir para outra escola |
| `POST` | `/api/alunos/{id}/vinculos` | Vincular professor |
| `GET/POST` | `/api/relatorios/` | Listar / Criar relatórios |
| `GET` | `/api/relatorios/templates` | Listar templates disponíveis |
| `GET/PUT` | `/api/relatorios/{id}` | Detalhe / Atualizar relatório |
| `POST` | `/api/relatorios/{id}/comentarios` | Adicionar comentário |
| `POST` | `/api/relatorios/sync` | Sincronizar relatórios offline |
| `POST` | `/api/fotos/` | Enviar foto pedagógica |
| `GET` | `/api/fotos/aluno/{id}` | Fotos de um aluno |
| `POST` | `/api/fotos/sync` | Sincronizar fotos offline |
| `GET` | `/api/dashboard/` | Métricas da escola |
| `GET` | `/api/sync/pull` | Pull de dados para offline |
| `POST` | `/api/sync/reports/resolve` | Resolver conflito offline |
| `GET` | `/health` | Status da API |

---

## 🏗️ Arquitetura do Projeto

```
WebAEE/
├── backend/
│   ├── app/
│   │   ├── domain/           # Entidades e regras de negócio puras
│   │   │   ├── models.py     # Student, StatusAluno, etc.
│   │   │   └── entities/     # School, User, Report, Photo...
│   │   ├── application/      # Casos de uso (Use Cases)
│   │   │   ├── use_cases/    # CreateStudent, ArchiveStudent...
│   │   │   └── ports/        # Interfaces dos repositórios
│   │   ├── infrastructure/   # Implementações concretas
│   │   │   ├── repositories/ # SQLModel + PostgreSQL
│   │   │   └── database.py   # Conexão async com o banco
│   │   └── interfaces/       # HTTP: routers, schemas, deps
│   │       ├── routers/      # FastAPI routes
│   │       ├── schemas/      # Pydantic request/response
│   │       └── dependencies.py # Auth, sessão DB
│   ├── alembic/              # Migrations do banco
│   │   └── versions/         # Histórico de migrações
│   └── tests/                # Testes automatizados
│       ├── application/      # Testes dos use cases
│       └── integration/      # Testes de API
├── docker-compose.yml         # Orquestração dos serviços
└── GUIA.md                    # Este arquivo!
```

---

> **Próximo passo:** Desenvolvimento do frontend PWA com Next.js!
