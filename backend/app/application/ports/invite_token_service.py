"""
Sistema AEE — Porta: Serviço de Token de Convite
==================================================
Abstrai a geração de tokens de convite para que o Use Case
CreateUserUseCase não dependa de detalhes de infraestrutura
(JWT, algoritmos, secrets).

Princípio DIP (Dependency Inversion): o Use Case depende desta
abstração; a implementação concreta (JWT) vive em infrastructure/.
"""

from __future__ import annotations

import uuid
from typing import Protocol


class InviteTokenService(Protocol):
    """Contrato para geração de tokens de convite.

    Implementado na infraestrutura; injetado no CreateUserUseCase via DI.
    """

    def create_invite_token(self, user_id: uuid.UUID) -> str:
        """Gera um token de convite seguro para o user_id fornecido.

        Args:
            user_id: ID do usuário recém-criado.

        Returns:
            Token de convite pronto para ser enviado por e-mail.
        """
        ...
