"""
One-time backfill script: generate embeddings for existing items.

Usage (from backend/):
    python -m scripts.backfill_embeddings

Safe to re-run — skips items that already have embeddings.
Processes in batches of 50 for efficiency.
"""
import sys
import os

# Ensure the backend package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.database import SessionLocal
# Import all models to resolve SQLAlchemy relationships
from app.models.user import User  # noqa: F401
from app.models.item import Item
from app.models.chat import ChatSession, ChatMessage, UserMemory  # noqa: F401
from app.services.ai.embeddings import embedding_service

BATCH_SIZE = 50


def backfill():
    if not embedding_service.available:
        print("Embedding service is not available. Check EMBEDDING_API_KEY or AIML_API_KEY in .env")
        sys.exit(1)

    db = SessionLocal()
    try:
        # Count items needing embeddings
        total = db.query(Item).filter(Item.content_embedding.is_(None)).count()
        print(f"Found {total} items without embeddings")

        if total == 0:
            print("Nothing to do!")
            return

        processed = 0
        failed = 0
        offset = 0

        while offset < total:
            items = (
                db.query(Item)
                .filter(Item.content_embedding.is_(None))
                .order_by(Item.created_at.asc())
                .limit(BATCH_SIZE)
                .all()
            )

            if not items:
                break

            # Build text for each item
            texts = []
            for item in items:
                parts = [item.content]
                if item.summary:
                    parts.append(item.summary)
                if item.tags:
                    parts.append(" ".join(item.tags))
                texts.append(" ".join(parts))

            # Try batch embedding first
            vectors = embedding_service.embed_batch(texts)

            if vectors and len(vectors) == len(items):
                for item, vec in zip(items, vectors):
                    item.content_embedding = vec
                    processed += 1
            else:
                # Fallback: embed individually
                print(f"  Batch failed, falling back to individual embedding...")
                for item, text in zip(items, texts):
                    vec = embedding_service.embed_text(text)
                    if vec is not None:
                        item.content_embedding = vec
                        processed += 1
                    else:
                        failed += 1

            db.commit()
            offset += BATCH_SIZE
            print(f"  Progress: {processed}/{total} embedded, {failed} failed")

        print(f"\nDone! Embedded {processed} items, {failed} failures.")

    finally:
        db.close()


if __name__ == "__main__":
    backfill()
