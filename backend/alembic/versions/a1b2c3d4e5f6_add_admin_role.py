"""Add admin role to papelusuario enum

Revision ID: a1b2c3d4e5f6
Revises: ef9a0507274f
Create Date: 2026-04-08 21:24:00.000000

"""
from typing import Sequence, Union
from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'ef9a0507274f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Adiciona o valor 'ADMIN' ao enum papelusuario no PostgreSQL."""
    # PostgreSQL permite adicionar valores ao enum sem recriar a tabela
    op.execute("ALTER TYPE papelusuario ADD VALUE IF NOT EXISTS 'ADMIN' BEFORE 'COORDENACAO'")


def downgrade() -> None:
    """
    Nota: PostgreSQL não suporta remoção de valores de enum diretamente.
    Para reverter, seria necessário recriar o enum sem o valor ADMIN.
    Esta operação é considerada segura em downgrade pois o valor simplesmente
    deixa de ser usado pelo código da aplicação.
    """
    pass
