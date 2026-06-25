"""
Sistema AEE — Value Object: Email
==================================
Garante que qualquer email no domínio seja válido e normalizado.

Regras encapsuladas:
- Formato válido (regex RFC-simplificado).
- Normalização para lowercase (ex: "João@ESCOLA.Gov.Br" → "joão@escola.gov.br").
- Imutável por herança de str — pode ser usado diretamente onde str é esperado.

Uso:
    from app.domain.value_objects.email import Email

    email = Email("Professor@Escola.Gov.Br")
    print(email)          # "professor@escola.gov.br"
    print(email.dominio)  # "escola.gov.br"

    Email("invalido")  # raises ValueError
"""

from __future__ import annotations

import re

_EMAIL_RE = re.compile(
    r"^[a-zA-Z0-9_.+\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-.]+$"
)


class Email(str):
    """Value Object imutável que representa um e-mail válido e normalizado.

    Herda de str para compatibilidade total com código que espera string.
    A normalização (lowercase) ocorre na construção — nunca há email com
    letras maiúsculas no domínio.
    """

    def __new__(cls, value: str) -> Email:
        normalized = value.strip().lower()
        if not _EMAIL_RE.match(normalized):
            raise ValueError(
                f"E-mail inválido: '{value}'. "
                "O formato esperado é usuario@dominio.tld."
            )
        instance = super().__new__(cls, normalized)
        return instance

    @property
    def dominio(self) -> str:
        """Retorna apenas o domínio do e-mail (parte após o '@')."""
        return self.split("@")[1]

    @property
    def usuario(self) -> str:
        """Retorna apenas o usuário do e-mail (parte antes do '@')."""
        return self.split("@")[0]
