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
  - Métodos ricos da entidade (arquivar, registrar_consentimento_lgpd)

Padrão BDD (Given / When / Then) aplicado em todos os testes:
  - Given → estado inicial / pré-condição
  - When  → ação sobre o sistema / entidade
  - Then  → verificação da consequência esperada

Como rodar:
    cd backend
    pytest tests/domain/test_models.py -v

Nenhum banco é iniciado neste nível. SQLModel permite instanciar
modelos como objetos Python puros sem sessão de banco de dados.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest

from app.domain.exceptions import AlunoJaArquivadoError
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
        data_consentimento=datetime.now(UTC),
        base_legal="Lei 13.146/2015 — LBI",
    )


# ─────────────────────────────────────────────────────────
# Testes: instanciação e defaults
# ─────────────────────────────────────────────────────────


class TestStudentInstanciacao:
    """Garante que Student é instanciado corretamente com defaults esperados."""

    def test_status_default_deve_ser_ativo(self) -> None:
        """Status inicial DEVE ser ATIVO (nunca arquivado ou None)."""
        # Given: apenas os campos obrigatórios — sem status explícito
        tenant_id = uuid.uuid4()

        # When: a entidade Student é instanciada
        aluno = Student(nome="João da Silva", tenant_id=tenant_id)

        # Then: o status padrão deve ser ATIVO
        assert aluno.status == StatusAluno.ATIVO

    def test_status_eh_string_ativo(self) -> None:
        """StatusAluno é um StrEnum — o valor string deve ser 'ativo'."""
        # Given: aluno instanciado sem status
        aluno = Student(nome="Maria", tenant_id=uuid.uuid4())

        # When / Then: comparação com string deve funcionar (StrEnum)
        assert aluno.status == "ativo"

    def test_id_gerado_automaticamente(self) -> None:
        """PK deve ser gerada automaticamente (UUID4, não None)."""
        # Given / When: instanciação simples
        aluno = Student(nome="Paulo", tenant_id=uuid.uuid4())

        # Then: id deve existir e ser UUID válido
        assert aluno.id is not None
        assert isinstance(aluno.id, uuid.UUID)

    def test_dois_alunos_tem_ids_distintos(self) -> None:
        """Cada instância deve ter UUID único — garantia de offline-safe."""
        # Given: mesmo tenant, dois alunos diferentes
        tenant_id = uuid.uuid4()

        # When: ambos são instanciados
        a1 = Student(nome="Maria", tenant_id=tenant_id)
        a2 = Student(nome="João", tenant_id=tenant_id)

        # Then: ids devem ser distintos
        assert a1.id != a2.id

    def test_created_at_preenchido_por_default(self) -> None:
        """created_at deve ser gerado automaticamente no momento da instanciação."""
        # Given / When: instanciação sem created_at explícito
        aluno = Student(nome="Sofia", tenant_id=uuid.uuid4())

        # Then: campo deve existir e ser datetime
        assert aluno.created_at is not None
        assert isinstance(aluno.created_at, datetime)

    def test_conflict_flag_default_false(self) -> None:
        """conflict_flag inicial deve ser False — nenhum conflito de sync pendente."""
        # Given / When: nova instância
        aluno = Student(nome="Carlos", tenant_id=uuid.uuid4())

        # Then: sem conflito por padrão
        assert aluno.conflict_flag is False

    def test_consentimento_lgpd_default_false(self) -> None:
        """Consentimento LGPD deve ser False por default — requer ação explícita."""
        # Given / When: aluno criado sem consentimento
        aluno = Student(nome="Ana", tenant_id=uuid.uuid4())

        # Then: consentimento não pode ser presumido — exige ação positiva
        assert aluno.consentimento_lgpd is False


# ─────────────────────────────────────────────────────────
# Testes: campos opcionais / LGPD
# ─────────────────────────────────────────────────────────


class TestStudentCamposOpcionais:
    """Testa campos opcionais e sensíveis."""

    def test_campos_sensiveis_default_none(self, aluno_minimo: Student) -> None:
        """
        Given: aluno criado sem diagnóstico ou laudo
        When: os campos sensíveis são acessados
        Then: devem retornar None (nunca string vazia ou valor padrão)
        """
        assert aluno_minimo.diagnostico is None
        assert aluno_minimo.laudo is None

    def test_escola_atual_default_none(self, aluno_minimo: Student) -> None:
        """
        Given: aluno cadastrado sem escola (matriculação pendente)
        When: escola_atual_id é acessado
        Then: deve ser None — escola é opcional no cadastro inicial
        """
        assert aluno_minimo.escola_atual_id is None

    def test_campos_sensiveis_preservados_quando_fornecidos(
        self, aluno_completo: Student
    ) -> None:
        """
        Given: aluno completo com diagnóstico e laudo
        When: os campos são acessados
        Then: os valores devem ser exatamente os fornecidos na criação
        """
        assert aluno_completo.diagnostico == "TEA nível 1"
        assert aluno_completo.laudo == "CID-11: 6A02.0"

    def test_base_legal_armazenada(self, aluno_completo: Student) -> None:
        """
        Given: aluno com consentimento LGPD e base legal registrada
        When: base_legal é acessada
        Then: deve conter exatamente o fundamento legal fornecido
        """
        assert aluno_completo.base_legal == "Lei 13.146/2015 — LBI"

    def test_tenant_id_preservado(
        self, aluno_minimo: Student, tenant_id: uuid.UUID
    ) -> None:
        """
        Given: aluno criado com tenant_id específico
        When: tenant_id é acessado
        Then: deve ser idêntico ao valor passado na criação (isolamento multi-tenant)
        """
        assert aluno_minimo.tenant_id == tenant_id


# ─────────────────────────────────────────────────────────
# Testes: soft-delete e ciclo de vida
# ─────────────────────────────────────────────────────────


class TestStudentSoftDelete:
    """Garante que o soft-delete (via método rico) funciona corretamente."""

    def test_arquivar_muda_status_para_arquivado(self) -> None:
        """
        Given: aluno ativo com user_id do executor
        When: student.arquivar(user_id) é chamado
        Then: status deve mudar para ARQUIVADO e updated_by deve ser registrado
        """
        # Given
        user_id = uuid.uuid4()
        aluno = Student(nome="Pedro", tenant_id=uuid.uuid4())
        assert aluno.status == StatusAluno.ATIVO

        # When
        aluno.arquivar(user_id)

        # Then
        assert aluno.status == StatusAluno.ARQUIVADO
        assert aluno.updated_by == user_id

    def test_arquivar_duas_vezes_levanta_erro(self) -> None:
        """
        Given: aluno já arquivado
        When: arquivar() é chamado novamente
        Then: deve levantar AlunoJaArquivadoError (operação idempotente proibida)
        """
        # Given
        user_id = uuid.uuid4()
        aluno = Student(nome="Pedro", tenant_id=uuid.uuid4())
        aluno.arquivar(user_id)

        # When / Then
        with pytest.raises(AlunoJaArquivadoError):
            aluno.arquivar(user_id)

    def test_status_arquivado_eh_string(self) -> None:
        """
        Given: aluno recém-arquivado
        When: status é comparado com string
        Then: deve ser igual a 'arquivado' (StrEnum compatibilidade)
        """
        # Given
        aluno = Student(nome="Luiza", tenant_id=uuid.uuid4())

        # When
        aluno.arquivar(uuid.uuid4())

        # Then
        assert aluno.status == "arquivado"

    def test_status_invalido_levanta_excecao(self) -> None:
        """
        Given: payload com status inválido
        When: Student é instanciado
        Then: Pydantic v2 deve rejeitar com ValidationError
        """
        # Given
        tenant_id = uuid.uuid4()

        # When / Then
        with pytest.raises(Exception):  # ValidationError do Pydantic
            Student(nome="Teste", tenant_id=tenant_id, status="deletado")

    def test_pode_ser_editado_retorna_false_para_arquivado(self) -> None:
        """
        Given: aluno arquivado
        When: pode_ser_editado() é chamado
        Then: deve retornar False — alunos arquivados são imutáveis
        """
        # Given
        aluno = Student(nome="Marco", tenant_id=uuid.uuid4())
        aluno.arquivar(uuid.uuid4())

        # When
        pode_editar = aluno.pode_ser_editado()

        # Then
        assert pode_editar is False

    def test_registrar_consentimento_lgpd_define_tres_campos_juntos(self) -> None:
        """
        Given: aluno sem consentimento LGPD
        When: registrar_consentimento_lgpd() é chamado com base legal
        Then: flag, timestamp e base_legal devem ser definidos atomicamente
        """
        # Given
        aluno = Student(nome="Beatriz", tenant_id=uuid.uuid4())
        assert aluno.consentimento_lgpd is False
        assert aluno.data_consentimento is None
        assert aluno.base_legal is None

        # When
        aluno.registrar_consentimento_lgpd("Lei 13.146/2015 — LBI")

        # Then: os três campos são definidos juntos — nunca parcialmente
        assert aluno.consentimento_lgpd is True
        assert aluno.data_consentimento is not None
        assert aluno.base_legal == "Lei 13.146/2015 — LBI"


# ─────────────────────────────────────────────────────────
# Testes: enums de domínio
# ─────────────────────────────────────────────────────────


class TestEnumsDominio:
    """Valida os enums de domínio independentemente da entidade."""

    def test_status_aluno_tem_dois_valores(self) -> None:
        """
        Given: enum StatusAluno definido no domínio
        When: todos os valores são enumerados
        Then: devem existir exatamente dois estados: ativo e arquivado
        """
        # Given / When
        valores = {e.value for e in StatusAluno}

        # Then
        assert valores == {"ativo", "arquivado"}

    def test_tag_pedagogica_tem_cinco_valores(self) -> None:
        """
        Given: enum TagPedagogica definido no domínio
        When: contagem de membros
        Then: devem existir exatamente 5 categorias pedagógicas
        """
        # Given / When / Then
        assert len(TagPedagogica) == 5

    def test_tag_pedagogica_valores_esperados(self) -> None:
        """
        Given: enum TagPedagogica
        When: os valores são verificados
        Then: todas as 5 categorias esperadas devem estar presentes
        """
        # Given / When
        valores = {e.value for e in TagPedagogica}

        # Then
        assert "autonomia" in valores
        assert "comunicacao" in valores
        assert "motor_fino" in valores
        assert "socializacao" in valores
        assert "outro" in valores
