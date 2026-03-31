-- Sistema AEE - Row Level Security (RLS) Policies
-- 
-- Executar este script no banco de dados PostgreSQL APÓS rodar as migrações (alembic upgrade head).
-- Garante isolamento estrito multi-tenant (SaaS).

-- 1. Habilitar RLS em todas as tabelas afetadas
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- 2. Criar a variável de sessão (current_tenant_id)
-- A aplicação deve definir essa variável antes de cada consulta PostgreSQL:
-- SET LOCAL app.current_tenant_id = 'uuid-do-tenant';

-- 3. Criar a política Universal para leitura e escrita na sessão do tenant
-- Policy for Students
CREATE POLICY tenant_isolation_students ON students
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy for Schools
CREATE POLICY tenant_isolation_schools ON schools
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy for Users
CREATE POLICY tenant_isolation_users ON users
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy for Reports
CREATE POLICY tenant_isolation_reports ON reports
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy for Report Templates
CREATE POLICY tenant_isolation_report_templates ON report_templates
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy for Photos
CREATE POLICY tenant_isolation_photos ON photos
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy for Professor Assignments
CREATE POLICY tenant_isolation_professor_assignments ON professor_assignments
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy for Audit Log
CREATE POLICY tenant_isolation_audit_log ON audit_log
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 4. Opcional: Policy de Bypass para administradores globais
-- CREATE POLICY bypass_rls ON students FOR ALL USING (current_user = 'postgres');

-- Lembrete para código da aplicação:
-- Para aplicar isso dinamicamente no FastAPI com SQLAlchemy / SQLModel:
-- 
-- @event.listens_for(Session, "do_orm_execute")
-- def receive_do_orm_execute(execute_state):
--     if execute_state.is_select:
--        pass # ou lidar com algo complexo se necessário
-- 
-- Ou melhor: na dependência de `get_session`
-- await session.execute(text("SET LOCAL app.current_tenant_id = :tenant_id"), {"tenant_id": str(current_tenant_id)})
