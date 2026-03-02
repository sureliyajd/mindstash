"""Add pgvector extension and content_embedding column to items

Revision ID: d4e5f6a7b8c9
Revises: b1c3e7f9a2d4
Create Date: 2026-03-03 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "b1c3e7f9a2d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgvector extension (must be enabled via Supabase dashboard first)
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # Add 1536-dimensional embedding column for semantic search
    op.execute("ALTER TABLE items ADD COLUMN content_embedding vector(1536)")

    # HNSW index — works on empty tables, no periodic rebuilding needed
    op.execute(
        "CREATE INDEX ix_items_content_embedding ON items "
        "USING hnsw (content_embedding vector_cosine_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_items_content_embedding")
    op.execute("ALTER TABLE items DROP COLUMN IF EXISTS content_embedding")
    op.execute("DROP EXTENSION IF EXISTS vector")
