"""
Shared embedding service for MindStash.

Used by both dynamic tool selection (in-memory cosine similarity)
and semantic item search (pgvector).

Gracefully degrades: if no API key is configured or the API is down,
all callers fall back to existing non-embedding behavior.
"""
import logging
from typing import Optional

import numpy as np
from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536


class EmbeddingService:
    """Lazy-initialized singleton for generating text embeddings."""

    def __init__(self):
        self._client: Optional[OpenAI] = None
        self._initialized = False

    def _init_client(self):
        """Initialize OpenAI client on first use. Credential priority:
        EMBEDDING_API_KEY > AIML_API_KEY > disabled."""
        if self._initialized:
            return

        self._initialized = True

        api_key = settings.EMBEDDING_API_KEY or settings.AIML_API_KEY
        if not api_key:
            logger.info("No embedding API key configured — embedding service disabled")
            return

        base_url = settings.EMBEDDING_BASE_URL
        if not base_url and not settings.EMBEDDING_API_KEY and settings.AIML_API_KEY:
            # Using AIML_API_KEY fallback — use AIML base URL
            base_url = "https://api.aimlapi.com/v1"

        kwargs = {"api_key": api_key}
        if base_url:
            kwargs["base_url"] = base_url

        self._client = OpenAI(**kwargs)
        logger.info("Embedding service initialized (model=%s)", EMBEDDING_MODEL)

    @property
    def available(self) -> bool:
        """Whether the embedding service has valid credentials."""
        self._init_client()
        return self._client is not None

    def embed_text(self, text: str) -> Optional[list[float]]:
        """Embed a single text string. Returns None on failure."""
        self._init_client()
        if not self._client:
            return None

        try:
            response = self._client.embeddings.create(
                model=EMBEDDING_MODEL,
                input=text,
            )
            return response.data[0].embedding
        except Exception as e:
            logger.warning("Embedding failed for text (len=%d): %s", len(text), e)
            return None

    def embed_batch(self, texts: list[str]) -> Optional[list[list[float]]]:
        """Embed multiple texts in one API call. Returns None on failure."""
        self._init_client()
        if not self._client or not texts:
            return None

        try:
            response = self._client.embeddings.create(
                model=EMBEDDING_MODEL,
                input=texts,
            )
            return [item.embedding for item in response.data]
        except Exception as e:
            logger.warning("Batch embedding failed (%d texts): %s", len(texts), e)
            return None

    @staticmethod
    def cosine_similarity(a: list[float], b: list[float]) -> float:
        """Compute cosine similarity between two vectors using numpy."""
        va = np.array(a)
        vb = np.array(b)
        dot = np.dot(va, vb)
        norm = np.linalg.norm(va) * np.linalg.norm(vb)
        if norm == 0:
            return 0.0
        return float(dot / norm)


# Module-level singleton
embedding_service = EmbeddingService()
