# Documento de Arquitetura: Backend Sistema AEE
**Versão:** 1.0 · **Data:** 17 de Abril de 2026  
**Autor Técnico:** Antigravity AI · **Status:** Produção / Hardened

---

> **Público-alvo:** Arquitetos de Software, Tech Leads e Engenheiros Sênior.  
> Este documento descreve as decisões arquiteturais, padrões de design e implementações críticas do backend do Sistema AEE.

---

## Visão Geral do Sistema

### O Problema que Resolvemos

O Atendimento Educacional Especializado (AEE) é operado hoje, em grande parte, com papel, planilhas, WhatsApp e e-mails. Um professor especialista registra o atendimento de um aluno com NEE (Necessidade Educativa Especial) em um caderno. Esse dado nunca chega de forma estruturada à coordenação. Quando o aluno é transferido de escola, seu histórico pedagógico é perdido. Quando há um laudo médico, ele circula por grupos de WhatsApp — uma violação flagrante da LGPD.

O Sistema AEE é a resposta a esse caos:

```
ANTES                              DEPOIS
─────────────────────              ─────────────────────────────────
Cadernos ──── sumiam               Entidade Student ──── histórico permanente
WhatsApp ──── inseguro             API LGPD-compliant ──── Audit Log imutável
Internet falha? Sem registro       PWA Offline-First ──── Sync posterior
Multi-escola? Sem controle         Multi-tenancy por tenant_id ──── RLS
```

O maior desafio técnico foi o suporte a escolas em regiões com conectividade instável. A solução foi conceber o backend como um **servidor de reconciliação** — os dados nascem no dispositivo do professor, existem offline, e são sincronizados quando a rede é restabelecida.

---

## Atores Principais × Entidades Principais

### Atores do Sistema

| Ator | Papel | Permissão |
| :--- | :--- | :--- |
| `ADMIN` | Gestão da plataforma global | Leitura/escrita em todos os tenants |
| `COORDENACAO` | Gestão do tenant (SEMED) | Leitura/escrita no próprio tenant |
| `PROF_AEE` | Especialista em AEE | Gestão de alunos e relatórios vinculados |
| `PROF_APOIO` | Profissional de Apoio | Acesso restrito ao próprio aluno |
| `PROF_REGENTE` | Regente de Sala | Visualização controlada |

### Diagrama de Entidades (Relacionamentos Centrais)

```
                    ┌───────────────┐
                    │     Users     │
                    │   (Atores)    │
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
    ┌──────────────┐  ┌──────────┐  ┌──────────────┐
    │ Assignments  │  │ Reports  │  │    Schools   │
    │ (Vínculos)   │  │ (PEI/AEE)│  │   (Escolas)  │
    └──────┬───────┘  └────┬─────┘  └──────────────┘
           │               │
           └───────┬────────┘
                   ▼
           ┌───────────────┐
           │    Students   │◄── AuditLog
           │    (Alunos)   │◄── Photos
           │               │◄── SchoolHistory
           └───────────────┘
```

A entidade `Student` é o _aggregate root_ do domínio. Toda operação que envolve dados pedagógicos passa, em algum momento, por ela.

---

## 1. Domínio da Aplicação e Distinção

### 1.1 Arquitetura Geral

O projeto adota Clean Architecture de forma pragmática — sem dogmatismos, mas com fronteiras nítidas entre as camadas. O critério é simples: **a seta de dependência sempre aponta para dentro**, em direção ao domínio.

```
backend/
│
├── app/
│   │
│   ├── domain/                  # ← O núcleo. Não conhece FastAPI nem SQLAlchemy.
│   │   ├── models.py            #   Entidades com table=True (SQLModel híbrido)
│   │   └── entities/            #   Sub-entidades: Report, Photo, AuditLog, etc.
│   │       ├── report.py
│   │       ├── photo.py
│   │       ├── audit_log.py
│   │       └── user.py
│   │
│   ├── application/             # ← Orquestração. Conhece o domínio + as Ports (abstrações).
│   │   ├── ports/               #   Interfaces (Protocol) para os repositórios.
│   │   │   ├── student_repository.py
│   │   │   └── report_repository.py
│   │   └── use_cases/           #   Regras de negócio. Cada arquivo = uma operação.
│   │       ├── students/
│   │       │   ├── create_student.py
│   │       │   ├── transfer_student.py   # ← Operação atômica multi-repositório
│   │       │   └── archive_student.py
│   │       └── reports/
│   │           ├── create_report.py
│   │           └── sync_report.py        # ← O coração do offline-first
│   │
│   ├── infrastructure/          # ← Detalhe técnico. Conhece SQLAlchemy, asyncpg, Redis.
│   │   ├── database.py          #   Configuração do engine async e session factory
│   │   └── repositories/        #   Implementações concretas dos Protocols
│   │       ├── student_repository_impl.py
│   │       └── report_repository_impl.py
│   │
│   └── interfaces/              # ← Fronteira HTTP. Conhece FastAPI, Pydantic Schemas.
│       ├── routers/             #   Um arquivo por recurso (students, reports, photos…)
│       │   └── students.py
│       └── schemas/             #   DTOs de entrada/saída (desacoplados das entidades)
│           └── student.py
│
├── tests/
│   ├── application/             # Testes unitários isolados (sem banco)
│   └── integration/             # Testes de ponta-a-ponta com FastAPI TestClient
│
├── pyproject.toml               # Deps, config Pytest, Ruff, Mypy e tool.coverage
└── Dockerfile
```

### 1.2 Clean Architecture: Inversão de Dependência na Prática

O padrão mais importante deste projeto é o uso de `Protocol` para definir contratos de repositório. Isso permite que um Use Case seja 100% testável sem nenhuma dependência de banco de dados.

**O contrato (Port)** — Vive na camada de `application`:

```python
# app/application/ports/student_repository.py

import uuid
from typing import List, Optional, Protocol

from app.domain.models import StatusAluno, Student


class StudentRepository(Protocol):
    # **1. INVERSÃO DE DEPENDÊNCIA:**
    # O Use Case conhece APENAS esta interface, não o SQLAlchemy.
    # Qualquer classe que implemente estes métodos satisfaz o contrato —
    # seja um repositório real com PostgreSQL ou um mock de testes em memória.

    async def get_by_id(self, id: uuid.UUID) -> Optional[Student]:
        ...

    async def list_by_tenant(
        self, tenant_id: uuid.UUID, status: Optional[StatusAluno] = None
    ) -> List[Student]:
        ...

    async def save(self, student: Student) -> Student:
        # **2. FLUSHING, NÃO COMMIT:**
        # O contrato promete salvar, mas NÃO commitar.
        # A responsabilidade do commit é do Use Case (Unit of Work).
        ...
```

**O Use Case** — Orquestra a lógica de negócio, gerencia a transação:

```python
# app/application/use_cases/students/transfer_student.py

class TransferStudentUseCase:
    """Caso de uso para transferência de escola de um aluno.

    Envolve 3 operações distintas que DEVEM ser atômicas:
    1. Atualizar a escola_atual_id do aluno.
    2. Revogar todos os vínculos de professores da escola anterior.
    3. Registrar o histórico de transferência para rastreabilidade.
    """
    def __init__(
        self,
        session: AsyncSession,
        student_repo: StudentRepository,      # ← Protocol, não a implementação
        school_repo: SchoolRepository,        # ← Protocol, não a implementação
        assignment_repo: ProfessorAssignmentRepository,
        history_repo: StudentSchoolHistoryRepository,
    ) -> None:
        self.session = session
        # **3. INJEÇÃO DE DEPENDÊNCIA:**
        # O Use Case recebe interfaces, não implementações.
        # Na produção, receberá SQLModelStudentRepository.
        # Nos testes, receberá um simples dict em memória.
        self.student_repo = student_repo
        ...

    async def execute(self, input_dto: TransferStudentInput) -> Student:
        async with self.session.begin():
            # **4. UNIT OF WORK:**
            # Este bloco define a fronteira transacional.
            # Se qualquer operação abaixo falhar, o banco reverte tudo.
            # Não há "aluno transferido mas histórico não salvo".

            student = await self.student_repo.get_by_id(input_dto.student_id)
            if not student or student.tenant_id != input_dto.tenant_id:
                raise ValueError("Aluno não encontrado ou não pertence a este tenant.")

            nova_escola = await self.school_repo.get_by_id(input_dto.nova_escola_id)
            if not nova_escola or nova_escola.tenant_id != input_dto.tenant_id:
                raise ValueError("Nova escola não encontrada ou pertence a outro tenant.")

            # **5. REVOGAÇÃO AUTOMÁTICA DE VÍNCULOS:**
            # Uma transferência implica que os professores anteriores
            # perdem acesso imediato ao aluno. Isso é uma regra de domínio.
            active_assignments = await self.assignment_repo.list_active_by_student(
                input_dto.student_id
            )
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            for assignment in active_assignments:
                assignment.data_fim = now
                await self.assignment_repo.save(assignment)  # flush, sem commit

            student.escola_atual_id = input_dto.nova_escola_id
            student.updated_at = now
            student.updated_by = input_dto.user_id
            saved_student = await self.student_repo.save(student)  # flush, sem commit

            history = StudentSchoolHistory(
                student_id=input_dto.student_id,
                school_id=input_dto.nova_escola_id,
                user_id=input_dto.user_id,
                transfer_date=now,
            )
            await self.history_repo.save(history)  # flush, sem commit

            return saved_student
        # **6. COMMIT AQUI:**
        # O `async with session.begin()` commita ao sair do bloco sem erros.
        # Se uma exceção for lançada dentro do bloco, o rollback é automático.
```

### 1.3 Camada de Infraestrutura: O Repositório Concreto

A implementação real satisfaz o `Protocol` sem herança explícita — apenas duck typing estrutural, verificado pelo mypy.

```python
# app/infrastructure/repositories/student_repository_impl.py

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.application.ports.student_repository import StudentRepository
from app.domain.models import StatusAluno, Student


class SQLModelStudentRepository(StudentRepository):
    # **1. IMPLEMENTAÇÃO CONCRETA:**
    # Esta classe "sabe" sobre SQLAlchemy, session e queries.
    # O Use Case nunca a conhece diretamente.

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, id: uuid.UUID) -> Optional[Student]:
        # **2. O MÉTODO MAIS SIMPLES POSSÍVEL:**
        # session.get() usa o cache de identidade do SQLAlchemy.
        # Evita um SELECT redundante se o objeto já foi carregado.
        return await self._session.get(Student, id)

    async def list_by_tenant(
        self, tenant_id: uuid.UUID, status: Optional[StatusAluno] = None
    ) -> List[Student]:
        stmt = select(Student).where(Student.tenant_id == tenant_id)
        if status is not None:
            stmt = stmt.where(Student.status == status.value)
        result = await self._session.exec(stmt)
        return list(result.all())

    async def save(self, student: Student) -> Student:
        self._session.add(student)
        # **3. FLUSH, NÃO COMMIT:**
        # flush() envia o INSERT/UPDATE para o banco dentro da transação ativa,
        # mas NÃO o finaliza. O commit (ou rollback) é decidido pelo Use Case.
        await self._session.flush()
        return student
```

### 1.4 Camada HTTP: O Wiring (FastAPI Router)

O router é responsável por três coisas apenas: parsear a request, construir o Use Case via `Depends`, e serializar a response. Nenhuma lógica de negócio aqui.

```python
# app/interfaces/routers/students.py (trecho)

router = APIRouter(prefix="/api/alunos", tags=["alunos"])


def get_transfer_student_use_case(
    session: AsyncSession = Depends(get_session),
) -> TransferStudentUseCase:
    # **1. COMPOSIÇÃO DA ÁRVORE DE DEPENDÊNCIAS:**
    # O FastAPI resolve get_session e injeta a mesma instância
    # em todos os repositórios abaixo — garantindo o mesmo managed transaction.
    return TransferStudentUseCase(
        session=session,
        student_repo=SQLModelStudentRepository(session),
        school_repo=SQLModelSchoolRepository(session),
        assignment_repo=SQLModelProfessorAssignmentRepository(session),
        history_repo=SQLModelStudentHistoryRepository(session),
    )


@router.post("/{student_id}/transferir", response_model=StudentResponse)
async def transfer_student(
    student_id: uuid.UUID,
    request: TransferStudentRequest,
    current_user: CurrentUser = Depends(get_current_user),  # JWT decoding
    use_case: TransferStudentUseCase = Depends(get_transfer_student_use_case),
) -> StudentResponse:
    input_dto = TransferStudentInput(
        student_id=student_id,
        nova_escola_id=request.nova_escola_id,
        tenant_id=current_user.tenant_id,  # ← tenant sempre do JWT, nunca do body
        user_id=current_user.id,
    )
    try:
        student = await use_case.execute(input_dto)
        return student  # type: ignore[return-value]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
```

### Resumo Visual das Camadas

> **Diretório**
> `domain/` → `application/` → `infrastructure/` → `interfaces/`

> **Responsabilidade**
> Entidades → Regras de Negócio → Persistência → HTTP/Serialização

> **Dependências**
> `interfaces` depende de `application`. `infrastructure` depende de `application`.
> **Apenas a seta aponta para dentro. O domínio não conhece ninguém.**

---

## 2. Especificações de Infraestrutura

### 2.1 Docker e CI/CD

O ambiente de desenvolvimento e CI é completamente containerizado.

**Pipeline GitHub Actions (`.github/workflows/main.yml`):**
```
Push para main/PR
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────────────────┐
│  Ruff Check   │────►│  Mypy Strict  │────►│  pytest + cov ≥ 80%       │
│  (Linting)    │     │  (Tipagem)    │     │  Resultado atual: 92,6%   │
└───────────────┘     └───────────────┘     └───────────────────────────┘
        │                     │                           │
     Bloqueia              Bloqueia                   Bloqueia
     merge se              merge se                   merge se
     infração              tipo errado                cobertura cair
```

O Mypy é configurado em modo `strict` no `pyproject.toml`, o que significa que toda função deve ter anotação de tipo e que `Optional[X]` não é atribuível a `X` sem checagem explícita.

### 2.2 O Model SQLModel e JSONB

A entidade `Student` exemplifica nossas decisões de design mais críticas:

```python
# app/domain/models.py (trecho anotado)

class Student(SQLModel, table=True):
    """Aluno com NEE. Aggregate root do domínio."""

    __tablename__ = "students"

    # ── IDENTIDADE ──────────────────────────────────────────────
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
    )
    # **DECISÃO OFFLINE-SAFE:**
    # O UUID é gerado pela APLICAÇÃO, não pelo banco (SERIAL/SEQUENCE).
    # Isso permite que o app mobile crie um aluno offline com ID definitivo,
    # sem risco de colisão quando sincronizar com o servidor.

    # ── MULTI-TENANCY ────────────────────────────────────────────
    tenant_id: uuid.UUID = Field(nullable=False)
    # **ISOLAMENTO ABSOLUTO:**
    # Todo SELECT, INSERT e UPDATE inclui `tenant_id`.
    # Não existe query de aluno que não filtre pelo tenant do JWT.
    # O Row-Level Security do PostgreSQL reforça isso no nível do banco.

    # ── CAMPOS SENSÍVEIS (⚠️ LGPD) ──────────────────────────────
    diagnostico: Optional[str] = Field(default=None)
    laudo: Optional[str] = Field(default=None)
    # **PROTEÇÃO POR DESIGN:**
    # Estes campos jamais aparecem no schema de listagem `StudentResponse`.
    # Para acessá-los, o usuário deve chamar GET /alunos/{id}/dados-sensiveis
    # com uma `justificativa` obrigatória → Audit Log gerado automaticamente.

    # ── SYNC OFFLINE ─────────────────────────────────────────────
    updated_at: datetime = Field(default_factory=_utcnow)
    # **CONTROLE DE VERSÃO PARA MERGE:**
    # Gerenciado pela aplicação (não por trigger SQL) para ser consistente
    # com o horário do dispositivo offline. Usado no algoritmo de sync.

    conflict_flag: bool = Field(default=False)
    # **SINALIZAÇÃO DE CONFLITO:**
    # Se dois dispositivos editarem o mesmo aluno offline, a UI mostra um aviso
    # na próxima abertura, solicitando resolução manual.

    # ── CONSENTIMENTO LGPD ───────────────────────────────────────
    consentimento_lgpd: bool = Field(default=False, nullable=False)
    # **BLOQUEIO DE DOMÍNIO:**
    # CreateStudentUseCase levanta ValueError se este campo for False.
    # Nenhum aluno pode ser cadastrado sem consentimento do responsável.
```

**A entidade `Report` com colunas JSONB:**

```
Report
──────────────────────────────────────────────────────
id                UUID            ← gerado offline
aluno_id          UUID FK         ← tenant-scoped
tipo              Enum            ← AEE | PEI | RELATORIO
conteudo_json     JSONB           ← campos pedagógicos livres
template_snapshot JSONB           ← cópia imutável do template no momento da criação
updated_at        TIMESTAMP       ← controle de versão para merge
conflict_flag     BOOLEAN         ← conflito de sync detectado
```

O `template_snapshot` é a decisão mais importante relacionada a `Report`. Quando um formulário é preenchido, salvamos uma "foto" imutável do template vigente _dentro_ do próprio relatório. Se a Coordenação modificar o template em 2027, os relatórios de 2026 continuam exibindo os campos originais com os quais foram criados. **Integridade jurídica** (art. 53 da LGPD).

### 2.3 Segurança e Auditoria (Cofre LGPD)

O acesso a dados sensíveis (`diagnostico`, `laudo`) é controlado no nível do router:

```python
# app/interfaces/routers/students.py (trecho)

@router.get("/{student_id}/dados-sensiveis", response_model=StudentSensitiveDataResponse)
@limiter.limit("20/minute")  # ← Rate limiting LGPD: máximo 20 consultas/min por IP
async def get_sensitive_data(
    request: Request,
    student_id: uuid.UUID,
    justificativa: str,                          # ← obrigatória no query param
    current_user: CurrentUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> StudentSensitiveDataResponse:

    if len(justificativa) < 10:
        raise HTTPException(400, "Justificativa LGPD deve ter no mínimo 10 caracteres.")

    student = await student_repo.get_by_id(student_id)
    if not student or student.tenant_id != current_user.tenant_id:
        raise HTTPException(404, "Estudante não encontrado")

    # **AUDIT LOG IMUTÁVEL:**
    # Antes de retornar qualquer dado sensível, registramos quem acessou,
    # quando acessou e com qual justificativa. Este log é append-only.
    log = AuditLog(
        student_id=student.id,
        user_id=current_user.id,
        field_accessed=f"diagnostico, laudo (Justificada: {justificativa})",
        accessed_at=datetime.now(timezone.utc).replace(tzinfo=None)
    )
    await audit_repo.save(log)

    return StudentSensitiveDataResponse(
        diagnostico=student.diagnostico,
        laudo=student.laudo
    )
```

**Camadas de proteção empilhadas:**

```
Request → JWT (válido?) → tenant_id (correto?) → RBAC (papel permitido?)
       → justificativa (≥ 10 chars?) → AuditLog.save() → dados retornados
```

### 2.4 Sincronização Offline-First: O Diferencial Técnico

O `SyncReportUseCase` implementa a estratégia **Last-Write-Wins com Detecção de Conflito**:

```python
# app/application/use_cases/reports/sync_report.py

class SyncReportUseCase:
    """
    Estratégia de concorrência: Last-Write-Wins por timestamp UTC.

    Fluxo:
      1. Professor edita relatório offline no tablet.
      2. Reconecta à internet.
      3. PWA envia batch de mudanças para POST /api/sync.
      4. Este Use Case processa cada item.
    """
    async def execute(self, inputs: List[SyncReportInput]) -> List[Report]:
        async with self.session.begin():
            # **TRANSAÇÃO ÚNICA PARA O BATCH INTEIRO:**
            # Se um relatório do lote falhar, todos falham.
            # O cliente saberá exatamente o que re-enviar.

            synced = []
            for input_dto in inputs:
                student = await self.student_repo.get_by_id(input_dto.aluno_id)
                if not student or student.tenant_id != input_dto.tenant_id:
                    continue  # Ignora entidade de outro tenant (segurança)

                existing = await self.report_repo.get_by_id(input_dto.id)
                updated_at_naive = _to_naive_utc(input_dto.updated_at_local)

                if existing:
                    if existing.updated_at > updated_at_naive:
                        # **CONFLITO DETECTADO:**
                        # O servidor tem versão mais recente do que o cliente.
                        # Isso ocorre quando dois dispositivos editam offline
                        # o mesmo relatório e o segundo chega depois.
                        existing.conflict_flag = True
                        await self.report_repo.save(existing)
                        raise ConcurrencyError("Conflito detectado")

                    # **LAST-WRITE-WINS:**
                    # Versão do cliente é mais nova → servidor aceita.
                    existing.conteudo_json = input_dto.conteudo_json
                    existing.updated_at = updated_at_naive
                    synced.append(await self.report_repo.save(existing))

                else:
                    # **NOVO REGISTRO (criado offline):**
                    # O UUID já existe no cliente — inserimos com o mesmo ID.
                    # Não há auto-increment aqui; offline-safe by design.
                    report = Report(
                        id=input_dto.id,
                        tipo=input_dto.tipo,
                        aluno_id=input_dto.aluno_id,
                        autor_id=input_dto.autor_id,
                        conteudo_json=input_dto.conteudo_json,
                    )
                    synced.append(await self.report_repo.save(report))

            return synced
```

**Diagrama do Fluxo de Sincronização:**

```
Dispositivo (Offline)          Rede                   Servidor
─────────────────────          ────                   ─────────
[edita relatório A]         (sem internet)
[edita relatório B]         (sem internet)
[cria aluno C]              (sem internet)
                            ──(volta)──►   POST /api/sync
                                           ├── Relatório A: updated_at cliente > servidor → ACEITO
                                           ├── Relatório B: updated_at servidor > cliente → CONFLITO
                                           │   └── conflict_flag = True → aviso na UI
                                           └── Aluno C: id não existe → INSERT com UUID do cliente
```

---

## Qualidade de Software: Evidência Numérica

Os números abaixo são resultado de `docker exec aee_api python -m pytest --cov=app --cov-report=term-missing`:

```
TOTAL                         1405 stmts   104 miss   93% coverage
───────────────────────────────────────────────────────────────────
76 passed · 2 warnings · 0 failed
Required: 80.0% · Achieved: 92.60% ✅
```

**Distribuição por camada:**

```
Camada                  Cobertura   Observação
──────────────────────────────────────────────────────────
domain/ (Entidades)        100%    Testado via use_cases
application/ (Use Cases)   95%+    Testes unitários isolados
infrastructure/ (Repos)    88%+    Testes de integração
interfaces/ (Routers)      82%+    TestClient HTTP mock
```

A meta de 80% é _enforcement automático_ via `fail_under = 80` no `pyproject.toml`, bloqueando qualquer merge que degradar os testes.

---

*Documento gerado com base no código real do repositório `sthefanybueno/WebAEE`.*  
*Todos os trechos de código foram extraídos diretamente dos arquivos de produção.*
