import asyncio
import sys
import os

# Adiciona o diretorio backend ao path para que o script possa importar 'app'
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from sqlmodel import SQLModel

# Importa todos os ORMs para povoar o SQLModel.metadata
from app.infrastructure.orm_models.base import *

DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_7syPWGQoxSN4@ep-gentle-bonus-acu3lh7e-pooler.sa-east-1.aws.neon.tech/neondb?ssl=require"

async def seed_db():
    print("Conectando ao Neon para criar as tabelas e o administrador padrão...")
    engine = create_async_engine(DATABASE_URL)
    
    # Cria todas as tabelas no Neon
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        print("Todas as tabelas criadas no Neon com sucesso!")
    
    # SQLs baseados no seed_reset.sql
    sqls = [
        "INSERT INTO tenants (id, nome, ativo, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000000000', 'Prefeitura Municipal', true, NOW(), NOW()) ON CONFLICT DO NOTHING;",
        "INSERT INTO users (id, tenant_id, email, hashed_password, nome, papel, ativo, created_at, updated_at) VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'admin@webaee.com.br', '$2b$12$havV6vqQRzBVLLR7kfK4p.e5SN7X.gTdshiX6Ojbu1RRrxKiuPU4e', 'Administrador do Sistema', 'ADMIN', true, NOW(), NOW()) ON CONFLICT DO NOTHING;"
    ]
    
    async with engine.begin() as conn:
        for sql in sqls:
            await conn.execute(text(sql))
        print("Usuário administrador padrão inserido com sucesso!")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_db())
