import logging
from app.application.ports.email_service import EmailService

logger = logging.getLogger(__name__)

class ConsoleEmailService(EmailService):
    """Implementação Mock do serviço de e-mail que apenas imprime no console.
    Ideal para ambiente de desenvolvimento local."""
    
    async def send_invite_email(self, to_email: str, token: str) -> None:
        # Link mágico de exemplo (aponta para um suposto front-end)
        magic_link = f"http://localhost:3000/aceitar-convite?token={token}"
        
        message = f"""
        ============================================================
        SIMULAÇÃO DE ENVIO DE E-MAIL (MOCK)
        ============================================================
        Para: {to_email}
        Assunto: Convite para o Sistema AEE
        
        Olá! Você foi convidado para acessar o Sistema AEE.
        Clique no link abaixo para criar sua senha e completar o cadastro:
        
        {magic_link}
        
        Este link expira em 48 horas.
        ============================================================
        """
        # Em vez de logger, vamos usar print direto para facilitar visualização no console dev
        print(message)
