import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_7syPWGQoxSN4@ep-gentle-bonus-acu3lh7e-pooler.sa-east-1.aws.neon.tech/neondb?ssl=require"

async def seed_db():
    print("Conectando ao Neon para criar o administrador padrão...")
    engine = create_async_engine(DATABASE_URL)
    
    # SQLs baseados no seed_reset.sql
    sqls = [
        "INSERT INTO tenants (id, nome, ativo, created_at, updated_at) VALUES ('00000000-0000-0000-0000-000000000000', 'Prefeitura Municipal', true, NOW(), NOW()) ON CONFLICT DO NOTHING;",
        "INSERT INTO users (id, tenant_id, email, hashed_password, nome, papel, ativo, created_at, updated_at) VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'admin@webaee.com.br', '$2b$12$havV6vqQRzBVLLR7kfK4p.e5SN7X.gTdshiX6Ojbu1RRrxKiuPU4e', 'Administrador do Sistema', 'ADMIN', true, NOW(), NOW()) ON CONFLICT DO NOTHING;"
    ]
    
    async with engine.begin() as conn:
        for sql in sqls:
            await conn.execute(text(sql))
        print("Usuário administrador padrão criado com sucesso!")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_db())
