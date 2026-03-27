-- ─────────────────────────────────────────────
-- Sistema AEE — Script de Inicialização do Banco
-- Executado automaticamente pelo PostgreSQL na
-- primeira inicialização do contêiner.
-- ─────────────────────────────────────────────

-- Habilita a extensão pgcrypto para gen_random_uuid()
-- (necessária para gerar UUIDs como PKs nas tabelas)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Nota: as tabelas serão criadas pelo Alembic (migrations).
-- Este script serve apenas para configurações iniciais
-- que não fazem parte das migrações da aplicação.
