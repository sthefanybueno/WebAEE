import logging

from app.application.ports.email_service import EmailService

logger = logging.getLogger(__name__)

class ConsoleEmailService(EmailService):
    """Implementação Mock do serviço de e-mail que apenas imprime no console.
    Ideal para ambiente de desenvolvimento local."""
    
    async def send_welcome_email(self, to_email: str, nome: str) -> None:
        message = f"""
        ============================================================
        SIMULAÇÃO DE ENVIO DE E-MAIL (MOCK)
        ============================================================
        Para: {to_email}
        Assunto: Bem-vindo(a) ao Sistema AEE!
        
        Olá {nome}! Sua conta no Sistema AEE foi criada com sucesso.
        Você já pode acessar o sistema utilizando o seu e-mail e a senha fornecida pelo administrador.
        ============================================================
        """
        print(message)
        
    async def send_status_change_email(self, to_email: str, nome: str, ativo: bool) -> None:
        status_str = "ativada" if ativo else "desativada"
        message = f"""
        ============================================================
        SIMULAÇÃO DE ENVIO DE E-MAIL (MOCK)
        ============================================================
        Para: {to_email}
        Assunto: Aviso de Alteração de Status - Sistema AEE
        
        Olá {nome},
        
        Informamos que sua conta no Sistema AEE foi {status_str} pelo administrador.
        ============================================================
        """
        print(message)
