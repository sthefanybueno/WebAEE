from typing import Protocol


class EmailService(Protocol):
    async def send_welcome_email(self, to_email: str, nome: str) -> None:
        """Envia um e-mail de boas-vindas após o cadastro."""
        ...
        
    async def send_status_change_email(self, to_email: str, nome: str, ativo: bool) -> None:
        """Envia um e-mail notificando a mudança de status (ativo/inativo)."""
        ...
