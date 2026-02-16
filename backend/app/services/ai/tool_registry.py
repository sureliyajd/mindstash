"""
Modular tool registry for MindStash AI agent.

Register tools with their schemas and execution functions.
Tools are grouped by agent_type for future multi-agent support.
"""
import logging
from typing import Callable, Optional
from sqlalchemy.orm import Session
from uuid import UUID

logger = logging.getLogger(__name__)


class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, dict] = {}

    def register(
        self,
        name: str,
        schema: dict,
        handler: Callable,
        agent_types: Optional[list[str]] = None,
    ):
        self._tools[name] = {
            "schema": schema,
            "handler": handler,
            "agent_types": agent_types or ["assistant"],
        }

    def get_schemas(self, agent_type: str = "assistant") -> list[dict]:
        return [
            t["schema"]
            for t in self._tools.values()
            if agent_type in t["agent_types"]
        ]

    def execute(self, name: str, db: Session, user_id: UUID, tool_input: dict) -> dict:
        tool = self._tools.get(name)
        if not tool:
            return {"error": f"Unknown tool: {name}"}
        try:
            return tool["handler"](db, user_id, tool_input)
        except Exception as e:
            logger.exception(f"Tool '{name}' failed: {e}")
            return {"error": str(e)}


# Global singleton
registry = ToolRegistry()
