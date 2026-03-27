"""
🔴 RED — Testes Unitários: Entidade Student
===========================================
Ciclo TDD — Fase 1: domínio puro, sem banco de dados, sem HTTP.

O que testamos aqui:
  - Valores default do modelo (status, timestamps, flags)
  - Imutabilidade do soft-delete (nunca deletar)
  - Validação dos enums de domínio
  - Geração de UUID único por instância
  - Comportamento de campos LGPD

Como rodar:
    cd backend
    pytest tests/domain/test_models.py -v

Nenhum banco é iniciado neste nível. SQLModel permite instanciar
modelos como objetos Python puros sem sessão de banco de dados.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest

from app.domain.models import StatusAluno, Student, TagPedagogica


# ─────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────


@pytest.fixture
def tenant_id() -> uuid.UUID:
    """UUID de tenant fictício para todos os testes."""
    return uuid.uuid4()


@pytest.fixture
def aluno_minimo(tenant_id: uuid.UUID) -> Student:
    """Instância de Student com apenas os campos obrigatórios."""
    return Student(
        nome="Ana Silva",
        tenant_id=tenant_id,
    )


@pytest.fixture
def aluno_completo(tenant_id: uuid.UUID) -> Student:
    """Instância de Student com todos os campos preenchidos."""
    escola_id = uuid.uuid4()
    return Student(
        nome="Carlos Eduardo Souza",
        tenant_id=tenant_id,
        escola_atual_id=escola_id,
        diagnostico="TEA nível 1",
        laudo="CID-11: 6A02.0",
        consentimento_lgpd=True,
        data_consentimento=datetime.now(timezone.utc),
        base_legal="Lei 13.146/2015 — LBI",
    )


# ─────────────────────────────────────────────────────────
# Testes: instanciação e defaults
# ─────────────────────────────────────────────────────────


class TestStudentInstanciacao:
    """Garante que Student é instanciado corretamente com defaults esperados."""

    def test_status_default_deve_ser_ativo(self, aluno_minimo: Student) -> None:
        """🔴 RED: status inicial DEVE ser ATIVO (nunca arquivado ou None)."""
        assert aluno_minimo.status == StatusAluno.ATIVO

    def test_status_eh_string_ativo(self, aluno_minimo: Student) -> None:
        """StatusAluno é um StrEnum — o valor string deve ser 'ativo'."""
        assert aluno_minimo.status == "ativo"

    def test_id_gerado_automaticamente(self, aluno_minimo: Student) -> None:
        """PK deve ser gerada automaticamente (UUID4, não None)."""
        assert aluno_minimo.id is not None
        assert isinstance(aluno_minimo.id, uuid.UUID)

    def test_dois_alunos_tem_ids_distintos(self, tenant_id: uuid.UUID) -> None:
        """Cada instância deve ter UUID único (offline-safe)."""
        a1 = Student(nome="Maria", tenant_id=tenant_id)
        a2 = Student(nome="João", tenant_id=tenant_id)
        assert a1.id != a2.id

    def test_created_at_preenchido_por_default(self, aluno_minimo: Student) -> None:
        """created_at deve ser gerado automaticamente no momento da instanciação."""
        assert aluno_minimo.created_at is not None
        assert isinstance(aluno_minimo.created_at, datetime)

    def test_updated_at_preenchido_por_default(self, aluno_minimo: Student) -> None:
        """updated_at deve ser gerado automaticamente (timezone-aware, UTC)."""
        assert aluno_minimo.updated_at is not None
        assert isinstance(aluno_minimo.updated_at, datetime)

    def test_timestamps_sao_timezone_aware(self, aluno_minimo: Student) -> None:
        """Timestamps DEVEM ser timezone-aware (UTC). datetime.utcnow() proibido."""
        assert aluno_minimo.created_at.tzinfo is not None
        assert aluno_minimo.updated_at.tzinfo is not None

    def test_conflict_flag_default_false(self, aluno_minimo: Student) -> None:
        """conflict_flag inicial deve ser False (sem conflito de sync)."""
        assert aluno_minimo.conflict_flag is False

    def test_consentimento_lgpd_default_false(self, aluno_minimo: Student) -> None:
        """Consentimento LGPD deve ser False por default — requer ação explícita."""
        assert aluno_minimo.consentimento_lgpd is False


# ─────────────────────────────────────────────────────────
# Testes: campos opcionais / LGPD
# ─────────────────────────────────────────────────────────


class TestStudentCamposOpcionais:
    """Testa campos opcionais e sensíveis."""

    def test_campos_sensiveis_default_none(self, aluno_minimo: Student) -> None:
        """diagnostico e laudo devem ser None quando não fornecidos."""
        assert aluno_minimo.diagnostico is None
        assert aluno_minimo.laudo is None

    def test_escola_atual_default_none(self, aluno_minimo: Student) -> None:
        """escola_atual_id é opcional no cadastro inicial."""
        assert aluno_minimo.escola_atual_id is None

    def test_campos_sensiveis_preservados_quando_fornecidos(
        self, aluno_completo: Student
    ) -> None:
        """Campos sensíveis fornecidos devem ser preservados na instância."""
        assert aluno_completo.diagnostico == "TEA nível 1"
        assert aluno_completo.laudo == "CID-11: 6A02.0"

    def test_base_legal_armazenada(self, aluno_completo: Student) -> None:
        """base_legal deve ser gravada quando fornecida."""
        assert aluno_completo.base_legal == "Lei 13.146/2015 — LBI"

    def test_tenant_id_preservado(
        self, aluno_minimo: Student, tenant_id: uuid.UUID
    ) -> None:
        """tenant_id deve ser exatamente o valor passado na criação."""
        assert aluno_minimo.tenant_id == tenant_id


# ─────────────────────────────────────────────────────────
# Testes: soft-delete e ciclo de vida
# ─────────────────────────────────────────────────────────


class TestStudentSoftDelete:
    """Garante que o soft-delete funciona e DELETE físico nunca ocorre."""

    def test_arquivar_aluno_muda_status(self, aluno_minimo: Student) -> None:
        """Arquivar deve mudar status para ARQUIVADO."""
        aluno_minimo.status = StatusAluno.ARQUIVADO
        assert aluno_minimo.status == StatusAluno.ARQUIVADO

    def test_status_arquivado_eh_string(self, aluno_minimo: Student) -> None:
        """StatusAluno.ARQUIVADO deve ser a string 'arquivado'."""
        aluno_minimo.status = StatusAluno.ARQUIVADO
        assert aluno_minimo.status == "arquivado"

    def test_status_invalido_levanta_excecao(self, tenant_id: uuid.UUID) -> None:
        """Status fora do Enum deve ser rejeitado pelo Pydantic v2."""
        with pytest.raises(Exception):  # ValidationError do Pydantic
            Student(nome="Teste", tenant_id=tenant_id, status="deletado")


# ─────────────────────────────────────────────────────────
# Testes: enums de domínio
# ─────────────────────────────────────────────────────────


class TestEnumsDominio:
    """Valida os enums de domínio independentemente da entidade."""

    def test_status_aluno_tem_dois_valores(self) -> None:
        """StatusAluno DEVE ter exatamente dois estados: ativo e arquivado."""
        valores = {e.value for e in StatusAluno}
        assert valores == {"ativo", "arquivado"}

    def test_tag_pedagogica_tem_cinco_valores(self) -> None:
        """TagPedagogica DEVE ter exatamente 5 categorias."""
        assert len(TagPedagogica) == 5

    def test_tag_pedagogica_valores_esperados(self) -> None:
        """Verifica que todas as tags pedagógicas existem."""
        valores = {e.value for e in TagPedagogica}
        assert "autonomia" in valores
        assert "comunicacao" in valores
        assert "motor_fino" in valores
        assert "socializacao" in valores
        assert "outro" in valores
