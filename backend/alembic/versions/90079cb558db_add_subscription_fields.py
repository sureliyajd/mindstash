"""add subscription fields

Revision ID: 90079cb558db
Revises: j0k1l2m3n4o5
Create Date: 2026-03-11 16:41:03.909972

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '90079cb558db'
down_revision: Union[str, None] = 'j0k1l2m3n4o5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add subscription / billing columns to users table
    op.add_column('users', sa.Column('plan', sa.String(length=20), server_default='free', nullable=False))
    op.add_column('users', sa.Column('plan_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('stripe_customer_id', sa.String(length=64), nullable=True))
    op.add_column('users', sa.Column('stripe_subscription_id', sa.String(length=64), nullable=True))
    op.add_column('users', sa.Column('stripe_price_id', sa.String(length=64), nullable=True))
    op.add_column('users', sa.Column('subscription_status', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('subscription_canceled_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('items_this_month', sa.Integer(), server_default='0', nullable=False))
    op.add_column('users', sa.Column('chat_messages_this_month', sa.Integer(), server_default='0', nullable=False))
    op.add_column('users', sa.Column('usage_reset_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False))
    op.create_index(op.f('ix_users_stripe_customer_id'), 'users', ['stripe_customer_id'], unique=True)
    op.create_index(op.f('ix_users_stripe_subscription_id'), 'users', ['stripe_subscription_id'], unique=True)

    # Create payment_events table (only if it doesn't already exist)
    conn = op.get_bind()
    if not conn.dialect.has_table(conn, 'payment_events'):
        op.create_table(
            'payment_events',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
            sa.Column('stripe_event_id', sa.String(length=64), nullable=False, unique=True),
            sa.Column('event_type', sa.String(length=64), nullable=False),
            sa.Column('stripe_object_id', sa.String(length=64), nullable=True),
            sa.Column('amount_cents', sa.Integer(), nullable=True),
            sa.Column('currency', sa.String(length=3), nullable=True),
            sa.Column('plan_keyword', sa.String(length=20), nullable=True),
            sa.Column('status', sa.String(length=20), nullable=True),
            sa.Column('raw_payload', postgresql.JSON(astext_type=sa.Text()), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        )
        op.create_index('ix_payment_events_user_id', 'payment_events', ['user_id'], unique=False)
        op.create_index('ix_payment_events_stripe_event_id', 'payment_events', ['stripe_event_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_stripe_subscription_id'), table_name='users')
    op.drop_index(op.f('ix_users_stripe_customer_id'), table_name='users')
    op.drop_column('users', 'usage_reset_at')
    op.drop_column('users', 'chat_messages_this_month')
    op.drop_column('users', 'items_this_month')
    op.drop_column('users', 'subscription_canceled_at')
    op.drop_column('users', 'subscription_status')
    op.drop_column('users', 'stripe_price_id')
    op.drop_column('users', 'stripe_subscription_id')
    op.drop_column('users', 'stripe_customer_id')
    op.drop_column('users', 'plan_expires_at')
    op.drop_column('users', 'plan')
