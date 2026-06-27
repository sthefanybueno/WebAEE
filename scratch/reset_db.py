import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import MetaData, text

DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_7syPWGQoxSN4@ep-gentle-bonus-acu3lh7e-pooler.sa-east-1.aws.neon.tech/neondb?ssl=require"

async def reset_db():
    print("Conectando ao Neon para limpar tabelas antigas...")
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.begin() as conn:
        # Desativa chaves estrangeiras temporariamente para evitar erros de vinculo
        await conn.execute(text("DROP SCHEMA public CASCADE;"))
        await conn.execute(text("CREATE SCHEMA public;"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
        print("Esquema limpo com sucesso!")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reset_db())
