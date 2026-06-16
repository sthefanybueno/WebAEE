"""
Sistema AEE — Exceções de Domínio
===================================
Hierarquia de exceções que representam quebras de regras de negócio.

Princípio DDD: as exceções vivem no Domínio e são capturadas na camada Web
(routers). Os Use Cases as levantam; os Routers as convertem em HTTPException.

Hierarquia:
    DomainException (base)
    ├── AlunoNaoEncontradoError        (404)
    ├── UsuarioNaoEncontradoError      (404)
    ├── EscolaNaoEncontradaError       (404)
    ├── RelatorioNaoEncontradoError    (404)
    ├── TenantMismatchError            (403)
    ├── PermissaoInsuficienteError     (403)
    ├── AlunoJaArquivadoError          (409)
    ├── RelatorioTravadoError          (409)
    ├── AlunoSemEscolaError            (409)
    ├── VinculoDuplicadoError          (409)
    ├── ConflitoSincronizacaoError     (409)
    ├── ConsentimentoLGPDAusenteError  (422)
    ├── JustificativaInsuficienteError (422)
    └── EmailJaEmUsoError              (409)
"""

from __future__ import annotations


class DomainException(Exception):
    """Base para todas as exceções de domínio do Sistema AEE.

    Permite captura genérica na camada Web sem vazar lógica de negócio.
    Toda subclasse deve passar a mensagem ao __init__ do pai.
    """

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message

    def __str__(self) -> str:
        return self.message


# ── Erros de entidade não encontrada (→ HTTP 404) ────────────────────────────


class AlunoNaoEncontradoError(DomainException):
    """Aluno inexistente ou não pertence ao tenant do usuário logado."""

    def __init__(self, student_id: object = None) -> None:
        detail = f"Aluno '{student_id}' não encontrado." if student_id else "Aluno não encontrado."
        super().__init__(detail)


class UsuarioNaoEncontradoError(DomainException):
    """Usuário inexistente ou não pertence ao tenant do usuário logado."""

    def __init__(self, user_id: object = None) -> None:
        detail = f"Usuário '{user_id}' não encontrado." if user_id else "Usuário não encontrado."
        super().__init__(detail)


class EscolaNaoEncontradaError(DomainException):
    """Escola inexistente ou pertence a tenant diferente."""

    def __init__(self, school_id: object = None) -> None:
        detail = f"Escola '{school_id}' não encontrada ou inacessível." if school_id else "Escola não encontrada."
        super().__init__(detail)


class RelatorioNaoEncontradoError(DomainException):
    """Relatório inexistente ou não acessível ao tenant do usuário."""

    def __init__(self, report_id: object = None) -> None:
        detail = f"Relatório '{report_id}' não encontrado." if report_id else "Relatório não encontrado."
        super().__init__(detail)


# ── Erros de autorização e isolamento (→ HTTP 403) ───────────────────────────


class TenantMismatchError(DomainException):
    """Operação tentou cruzar fronteira de tenant.

    Garante o princípio de isolamento: nenhum dado de um tenant
    é acessível por outro, mesmo com ID correto.
    """

    def __init__(self, recurso: str = "recurso") -> None:
        super().__init__(
            f"O {recurso} não pertence ao tenant do usuário logado. Acesso negado."
        )


class PermissaoInsuficienteError(DomainException):
    """Usuário não tem papel (role) suficiente para esta operação (RBAC)."""

    def __init__(self, acao: str = "operação", papel_requerido: str = "") -> None:
        detalhe = f" Papel requerido: {papel_requerido}." if papel_requerido else ""
        super().__init__(f"Permissão insuficiente para '{acao}'.{detalhe}")


# ── Erros de estado de entidade (→ HTTP 409 Conflict) ────────────────────────


class AlunoJaArquivadoError(DomainException):
    """Operação ilegal: o aluno já está no estado ARQUIVADO."""

    def __init__(self) -> None:
        super().__init__("Este aluno já está arquivado. Não é possível arquivar novamente.")


class RelatorioTravadoError(DomainException):
    """Operação ilegal: o relatório está travado (finalizado) e não aceita edições."""

    def __init__(self) -> None:
        super().__init__(
            "Este relatório está travado (finalizado). Nenhuma edição é permitida."
        )


class AlunoSemEscolaError(DomainException):
    """Operação ilegal: o aluno precisa estar matriculado em uma escola."""

    def __init__(self) -> None:
        super().__init__("O aluno não possui nenhuma escola ativa.")


class VinculoDuplicadoError(DomainException):
    """Operação ilegal: professor já vinculado ao aluno."""

    def __init__(self) -> None:
        super().__init__("Este usuário já possui um vínculo ativo com o aluno especificado.")


class ConflitoSincronizacaoError(DomainException):
    """Detectado conflito durante sincronização offline-first (Last-Write-Wins)."""

    def __init__(self) -> None:
        super().__init__("Conflito detectado na sincronização. Atualize seus dados locais.")


# ── Erros de regras de negócio e validação (→ HTTP 422) ──────────────────────


class ConsentimentoLGPDAusenteError(DomainException):
    """Operação bloqueada: consentimento LGPD do responsável não foi fornecido.

    Todo cadastro de aluno exige consentimento explícito do responsável
    antes de qualquer tratamento de dados pessoais (LGPD art. 7º, § 5º).
    """

    def __init__(self) -> None:
        super().__init__(
            "O consentimento LGPD do responsável é obrigatório para cadastrar o aluno. "
            "Forneça consentimento_lgpd=True e registre a base legal."
        )


class JustificativaInsuficienteError(DomainException):
    """Justificativa para acesso a dados sensíveis é muito curta ou ausente."""

    def __init__(self, minimo: int = 10) -> None:
        super().__init__(
            f"A justificativa para acesso a dados sensíveis deve ter no mínimo {minimo} caracteres (LGPD art. 37)."
        )


class EmailJaEmUsoError(DomainException):
    """E-mail já cadastrado no sistema — duplicidade não é permitida.

    Movido para o Domínio (Correção #2): exceções de regras de negócio
    devem viver em domain/exceptions.py, não em Use Cases.
    """

    def __init__(self, email: str) -> None:
        super().__init__(f"O e-mail '{email}' já está em uso por outro usuário.")
