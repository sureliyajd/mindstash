"""add_pending_confirmations_table

Revision ID: c2fa447829f7
Revises: f6g7h8i9j0k1
Create Date: 2026-03-03 16:42:46.661755

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c2fa447829f7'
down_revision: Union[str, None] = 'f6g7h8i9j0k1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('pending_confirmations',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('session_id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('tool_name', sa.String(), nullable=False),
    sa.Column('tool_input', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('tool_use_id', sa.String(), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('agent_context', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('resolved_at', sa.DateTime(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('expires_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pending_confirmations_id'), 'pending_confirmations', ['id'], unique=False)
    op.create_index(op.f('ix_pending_confirmations_session_id'), 'pending_confirmations', ['session_id'], unique=False)
    op.create_index(op.f('ix_pending_confirmations_user_id'), 'pending_confirmations', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_pending_confirmations_user_id'), table_name='pending_confirmations')
    op.drop_index(op.f('ix_pending_confirmations_session_id'), table_name='pending_confirmations')
    op.drop_index(op.f('ix_pending_confirmations_id'), table_name='pending_confirmations')
    op.drop_table('pending_confirmations')
