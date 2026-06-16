"""
Sistema AEE — Infraestrutura: JWT Invite Token Service
========================================================
Implementação concreta da porta InviteTokenService usando JWT.

Princípio DIP: o Use Case CreateUserUseCase recebe InviteTokenService
(abstrato); esta classe é a implementação concreta injetada pela factory
no Router — o Use Case nunca importa JWT diretamente.
"""

from __future__ import annotations

import uuid

from app.application.ports.invite_token_service import InviteTokenService
from app.infrastructure.security.tokens import create_invite_token as _create_jwt_token


class JWTInviteTokenService:
    """Serviço de tokens de convite baseado em JWT (HS256).

    Adaptador concreto que implementa InviteTokenService usando a
    função `create_invite_token` de infrastructure/security/tokens.py.
    """

    def create_invite_token(self, user_id: uuid.UUID) -> str:
        """Delega para a geração JWT real com expiração de 48h.

        Args:
            user_id: ID do usuário recém-criado.

        Returns:
            JWT assinado com algoritmo HS256 e TTL de 48h.
        """
        return _create_jwt_token(user_id)
