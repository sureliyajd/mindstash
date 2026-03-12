"""
Shared utility helpers for the MindStash backend.
"""
from fastapi import Request


def get_client_ip(request: Request) -> str:
    """
    Extract the real client IP from a request, accounting for Railway's
    proxy chain.

    Priority:
    1. X-Forwarded-For (first IP in the list — the originating client)
    2. X-Real-IP
    3. request.client.host (direct connection, e.g. local dev)
    """
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        # May be comma-separated list; first entry is the client
        return xff.split(",")[0].strip()

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()

    if request.client:
        return request.client.host

    return "unknown"
