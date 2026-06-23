"""Adicionar campos: apoio_id em students, aee_id em schedules,
papeis_com_acesso em report_templates, e tabela notifications

Revision ID: f1a2b3c4d5e6
Revises: e6630838985b
Create Date: 2026-06-22 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'e6630838985b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Adiciona apoio_id em students
    op.add_column(
        'students',
        sa.Column('apoio_id', sa.Uuid(), nullable=True)
    )

    # 2. Adiciona aee_id em schedules
    op.add_column(
        'schedules',
        sa.Column('aee_id', sa.Uuid(), nullable=True)
    )
    # Preenche com created_by como fallback para registros existentes
    op.execute("UPDATE schedules SET aee_id = created_by WHERE aee_id IS NULL AND created_by IS NOT NULL")
    # Para registros sem created_by, usa o primeiro admin do tenant (ou NULL se não existir)
    op.alter_column('schedules', 'aee_id', nullable=True)
    op.create_index(op.f('ix_schedules_aee_id'), 'schedules', ['aee_id'], unique=False)

    # 3. Adiciona papeis_com_acesso em report_templates
    op.add_column(
        'report_templates',
        sa.Column('papeis_com_acesso', sa.JSON(), nullable=True)
    )
    # Default: lista vazia (todos têm acesso)
    op.execute("UPDATE report_templates SET papeis_com_acesso = '[]' WHERE papeis_com_acesso IS NULL")

    # 4. Cria tabela notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('tenant_id', sa.Uuid(), nullable=False),
        sa.Column('autor_id', sa.Uuid(), nullable=False),
        sa.Column('tipo', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('mensagem', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=False),
        sa.Column('relatorio_id', sa.Uuid(), nullable=True),
        sa.Column('aluno_id', sa.Uuid(), nullable=True),
        sa.Column('lida', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index(op.f('ix_notifications_tenant_id'), 'notifications', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_notifications_relatorio_id'), 'notifications', ['relatorio_id'], unique=False)
    op.create_index(op.f('ix_notifications_aluno_id'), 'notifications', ['aluno_id'], unique=False)
    op.create_index(op.f('ix_notifications_lida'), 'notifications', ['lida'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Remove tabela notifications
    op.drop_index(op.f('ix_notifications_lida'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_aluno_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_relatorio_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_tenant_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    op.drop_table('notifications')

    # Remove papeis_com_acesso de report_templates
    op.drop_column('report_templates', 'papeis_com_acesso')

    # Remove aee_id de schedules
    op.drop_index(op.f('ix_schedules_aee_id'), table_name='schedules')
    op.drop_column('schedules', 'aee_id')

    # Remove apoio_id de students
    op.drop_column('students', 'apoio_id')
