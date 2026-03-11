"""rename stripe columns in payment_events

Revision ID: p1q2r3s4t5u6
Revises: 13e1cd28acdc
Create Date: 2026-03-11 20:00:00.000000

"""
from typing import Sequence, Union
from alembic import op

revision: str = 'p1q2r3s4t5u6'
down_revision: Union[str, None] = '13e1cd28acdc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index('ix_payment_events_stripe_event_id', table_name='payment_events')
    op.alter_column('payment_events', 'stripe_event_id', new_column_name='event_id')
    op.alter_column('payment_events', 'stripe_object_id', new_column_name='object_id')
    op.create_index('ix_payment_events_event_id', 'payment_events', ['event_id'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_payment_events_event_id', table_name='payment_events')
    op.alter_column('payment_events', 'event_id', new_column_name='stripe_event_id')
    op.alter_column('payment_events', 'object_id', new_column_name='stripe_object_id')
    op.create_index('ix_payment_events_stripe_event_id', 'payment_events', ['stripe_event_id'], unique=True)
