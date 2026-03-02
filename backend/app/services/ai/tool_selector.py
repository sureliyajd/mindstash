"""
Dynamic tool selection for the MindStash AI agent.

Instead of sending all 9 tool schemas on every Claude API call,
this module embeds tool descriptions and the user message, then
selects only the relevant tools via cosine similarity.

Fallback behavior: if embeddings are unavailable or too few tools
are selected, ALL tools are returned (identical to previous behavior).
"""
import logging
from typing import Optional

from app.services.ai.embeddings import embedding_service
from app.services.ai.tool_registry import registry

logger = logging.getLogger(__name__)

# Tools that are always included regardless of similarity score
BASE_TOOLS = {"search_items"}

# Minimum similarity threshold — tools below this are excluded
SIMILARITY_THRESHOLD = 0.3

# Safety net — if fewer than this many tools are selected, send all
MIN_TOOLS = 3

# Module-level cache: tool_name -> embedding vector
_tool_embeddings: dict[str, list[float]] = {}
_embeddings_initialized = False


def _init_tool_embeddings() -> bool:
    """Embed all tool descriptions once and cache them. Returns True on success."""
    global _embeddings_initialized

    if _embeddings_initialized:
        return bool(_tool_embeddings)

    _embeddings_initialized = True

    if not embedding_service.available:
        logger.info("Tool selector: embedding service unavailable, using all tools")
        return False

    # Build description texts from tool schemas
    tool_texts = {}
    for name, tool_data in registry._tools.items():
        schema = tool_data["schema"]
        desc = schema.get("description", name)
        tool_texts[name] = f"{name}: {desc}"

    if not tool_texts:
        return False

    names = list(tool_texts.keys())
    texts = [tool_texts[n] for n in names]

    vectors = embedding_service.embed_batch(texts)
    if not vectors or len(vectors) != len(names):
        logger.warning("Tool selector: failed to embed tool descriptions")
        return False

    for name, vec in zip(names, vectors):
        _tool_embeddings[name] = vec

    logger.info("Tool selector: cached embeddings for %d tools", len(_tool_embeddings))
    return True


def select_tools(user_message: str, agent_type: str = "assistant") -> list[dict]:
    """
    Select relevant tools for a user message.

    Drop-in replacement for registry.get_schemas(). Returns the same
    list[dict] format. Falls back to all tools on any failure.
    """
    all_schemas = registry.get_schemas(agent_type=agent_type)

    # If embedding service isn't ready, return everything
    if not _init_tool_embeddings():
        return all_schemas

    # Embed the user message
    message_vec = embedding_service.embed_text(user_message)
    if message_vec is None:
        return all_schemas

    # Score each tool
    scores: list[tuple[str, float]] = []
    for name, tool_vec in _tool_embeddings.items():
        # Only consider tools for this agent_type
        tool_data = registry._tools.get(name)
        if not tool_data or agent_type not in tool_data["agent_types"]:
            continue
        sim = embedding_service.cosine_similarity(message_vec, tool_vec)
        scores.append((name, sim))

    # Select tools above threshold + base tools
    selected_names = set(BASE_TOOLS)
    for name, sim in scores:
        if sim >= SIMILARITY_THRESHOLD:
            selected_names.add(name)

    # Safety: if too few selected, return all
    if len(selected_names) < MIN_TOOLS:
        logger.debug(
            "Tool selector: only %d tools selected (threshold=%s), returning all",
            len(selected_names), SIMILARITY_THRESHOLD,
        )
        return all_schemas

    # Filter schemas to only selected tools
    selected_schemas = [
        s for s in all_schemas if s.get("name") in selected_names
    ]

    logger.debug(
        "Tool selector: selected %d/%d tools for message: %s",
        len(selected_schemas), len(all_schemas),
        [s.get("name") for s in selected_schemas],
    )

    return selected_schemas
