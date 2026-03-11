"""rename stripe columns to lms

Revision ID: 13e1cd28acdc
Revises: k1l2m3n4o5p6
Create Date: 2026-03-11 18:39:58.477929

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '13e1cd28acdc'
down_revision: Union[str, None] = 'k1l2m3n4o5p6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new LMS columns
    op.add_column('users', sa.Column('lms_customer_id', sa.String(length=64), nullable=True))
    op.add_column('users', sa.Column('lms_subscription_id', sa.String(length=64), nullable=True))
    op.add_column('users', sa.Column('lms_variant_id', sa.String(length=64), nullable=True))

    # Drop old Stripe indexes before dropping columns
    op.drop_index('ix_users_stripe_customer_id', table_name='users')
    op.drop_index('ix_users_stripe_subscription_id', table_name='users')

    # Create new LMS indexes
    op.create_index(op.f('ix_users_lms_customer_id'), 'users', ['lms_customer_id'], unique=True)
    op.create_index(op.f('ix_users_lms_subscription_id'), 'users', ['lms_subscription_id'], unique=True)

    # Drop old Stripe columns
    op.drop_column('users', 'stripe_price_id')
    op.drop_column('users', 'stripe_subscription_id')
    op.drop_column('users', 'stripe_customer_id')


def downgrade() -> None:
    # Add back old Stripe columns
    op.add_column('users', sa.Column('stripe_customer_id', sa.VARCHAR(length=64), autoincrement=False, nullable=True))
    op.add_column('users', sa.Column('stripe_subscription_id', sa.VARCHAR(length=64), autoincrement=False, nullable=True))
    op.add_column('users', sa.Column('stripe_price_id', sa.VARCHAR(length=64), autoincrement=False, nullable=True))

    # Drop LMS indexes
    op.drop_index(op.f('ix_users_lms_subscription_id'), table_name='users')
    op.drop_index(op.f('ix_users_lms_customer_id'), table_name='users')

    # Create old Stripe indexes
    op.create_index('ix_users_stripe_subscription_id', 'users', ['stripe_subscription_id'], unique=True)
    op.create_index('ix_users_stripe_customer_id', 'users', ['stripe_customer_id'], unique=True)

    # Drop LMS columns
    op.drop_column('users', 'lms_variant_id')
    op.drop_column('users', 'lms_subscription_id')
    op.drop_column('users', 'lms_customer_id')
