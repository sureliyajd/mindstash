"""add activity logs

Revision ID: i9j0k1l2m3n4
Revises: h8i9j0k1l2m3
Create Date: 2026-03-10 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'i9j0k1l2m3n4'
down_revision = 'a7e3d98ee043'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'activity_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False, index=True),
        sa.Column('action', sa.String(64), nullable=False),
        sa.Column('source', sa.String(32), nullable=False, server_default='web'),
        sa.Column('resource_type', sa.String(32), nullable=True),
        sa.Column('resource_id', sa.String, nullable=True),
        sa.Column('details', postgresql.JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False),
    )
    op.create_index(
        'ix_activity_logs_user_id_created_at',
        'activity_logs',
        ['user_id', 'created_at'],
    )


def downgrade():
    op.drop_index('ix_activity_logs_user_id_created_at', table_name='activity_logs')
    op.drop_table('activity_logs')
