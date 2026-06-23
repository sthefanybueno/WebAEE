INSERT INTO tenants (id, nome, ativo, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', 'Prefeitura Municipal', true, NOW(), NOW());

INSERT INTO users (id, tenant_id, email, hashed_password, nome, papel, ativo, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'admin@webaee.com.br',
    '$2b$12$havV6vqQRzBVLLR7kfK4p.e5SN7X.gTdshiX6Ojbu1RRrxKiuPU4e',
    'Administrador do Sistema',
    'ADMIN'::papelusuario,
    true,
    NOW(),
    NOW()
);
