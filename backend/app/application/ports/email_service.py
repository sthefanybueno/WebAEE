from typing import Protocol

class EmailService(Protocol):
    async def send_invite_email(self, to_email: str, token: str) -> None:
        """Envia um e-mail com link mágico para o usuário recém-criado."""
        ...
