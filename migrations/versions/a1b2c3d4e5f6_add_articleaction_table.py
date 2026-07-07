"""add_articleaction_table

Revision ID: a1b2c3d4e5f6
Revises: 69afb365aff5
Create Date: 2026-07-02 03:30:00.000000

"""
from typing import Sequence, Union
import sqlmodel

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '69afb365aff5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create articleaction table."""
    op.create_table(
        'articleaction',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('article_id', sa.Integer(), nullable=False),
        sa.Column('action_type', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['article_id'], ['newsarticle.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_articleaction_article_id'), 'articleaction', ['article_id'], unique=False)
    op.create_index(op.f('ix_articleaction_action_type'), 'articleaction', ['action_type'], unique=False)


def downgrade() -> None:
    """Drop articleaction table."""
    op.drop_index(op.f('ix_articleaction_action_type'), table_name='articleaction')
    op.drop_index(op.f('ix_articleaction_article_id'), table_name='articleaction')
    op.drop_table('articleaction')
