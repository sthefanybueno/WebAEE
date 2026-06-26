# Walkthrough — Backend AEE: Fase 1 (Domínio Puro)

## O que foi feito

Implementação completa da **camada de domínio puro** do Sistema AEE, seguindo TDD: testes RED → código → GREEN.

---

## Estrutura criada

```
backend/app/domain/
├── models.py              # Student (entidade central) + enums: StatusAluno, TagPedagogica, SyncStatus
├── __init__.py            # Re-exports centralizados de todo o domínio
└── entities/
    ├── tenant.py          # Tenant (multi-tenancy, RLS)
    ├── user.py            # User + PapelUsuario enum
    ├── school.py          # School (escola vinculada ao tenant)
    ├── report.py          # Report + ReportTemplate + TipoRelatorio enum
    ├── photo.py           # Photo (evidências pedagógicas + SyncStatus)
    ├── professor_assignment.py  # ProfessorAssignment (N:N professor↔aluno)
    └── audit_log.py       # AuditLog (rastreio LGPD + SENSITIVE_FIELDS)
```

---

## Testes — 17/17 GREEN ✅

```
pytest tests/domain/test_models.py
....................   [100%]
17 passed
```

### Classes testadas

| Classe de teste | Cenários |
|---|---|
| `TestStudentInstanciacao` | defaults corretos (status, UUID, timestamps, flags) |
| `TestStudentCamposOpcionais` | campos LGPD e sensíveis (diagnostico, laudo) |
| `TestStudentSoftDelete` | arquivar altera status; enum inválido → ValueError |
| `TestEnumsDominio` | StatusAluno (2 valores), TagPedagogica (5 valores) |

---

## Descoberta técnica — SQLModel + Pydantic v2

**Problema**: `SQLModel(table=True)` desativa a validação Pydantic padrão no `__init__`.
Passar `status="deletado"` era aceito silenciosamente — `model_validator(mode='before')` foi ignorado.

**Solução**: Override explícito de `__init__` em `Student`:

```python
def __init__(self, **kwargs: object) -> None:
    if "status" in kwargs:
        kwargs["status"] = _validate_status_aluno(kwargs["status"])
    super().__init__(**kwargs)
```

Isso garante que qualquer valor inválido para `status` lança `ValueError` imediatamente.

---

## Próximos passos (Fase 2)

- `application/ports/` → 4 Protocol interfaces (repositórios)
- Casos de uso: `CreateStudent`, `ArchiveStudent`, `TransferStudent`
- Casos de uso: `CreateReport`, `SyncReport`
- Testes com mocks

---

## Ambiente

```
backend/.venv    ← pytest + sqlmodel + pydantic instalados
python           3.13
sqlmodel         0.0.21+
pydantic         v2.x
```
