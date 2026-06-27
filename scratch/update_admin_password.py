import asyncio
import sys
import os

# Adiciona o diretorio backend ao path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.infrastructure.security.passwords import get_password_hash

DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_7syPWGQoxSN4@ep-gentle-bonus-acu3lh7e-pooler.sa-east-1.aws.neon.tech/neondb?ssl=require"

async def update_password():
    password_to_hash = "admin123"
    print(f"Gerando hash para a senha: '{password_to_hash}'...")
    new_hash = get_password_hash(password_to_hash)
    print(f"Hash gerado: {new_hash}")
    
    print("Conectando ao Neon para atualizar o administrador...")
    engine = create_async_engine(DATABASE_URL)
    
    sql = "UPDATE users SET hashed_password = :new_hash WHERE email = 'admin@webaee.com.br';"
    
    async with engine.begin() as conn:
        await conn.execute(text(sql), {"new_hash": new_hash})
        print("Senha atualizada com sucesso no banco Neon!")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(update_password())
