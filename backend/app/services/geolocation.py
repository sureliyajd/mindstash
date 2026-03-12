"""
Async IP geolocation via ip-api.com (free, no key required).

Results are cached in-memory for the lifetime of the process to avoid
repeated lookups for the same IP.
"""
import asyncio
import logging
from typing import Dict, Optional

import httpx

logger = logging.getLogger(__name__)

# In-memory cache: ip_address -> geo dict
_cache: Dict[str, dict] = {}

_PRIVATE_PREFIXES = (
    "127.", "10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.",
    "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.",
    "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.",
    "::1", "localhost", "unknown",
)

_EMPTY = {"country": None, "city": None, "region": None, "country_code": None}


def _is_private(ip: str) -> bool:
    return any(ip.startswith(p) for p in _PRIVATE_PREFIXES)


async def lookup_ip(ip: str) -> dict:
    """
    Return geo info for *ip*.

    Returns a dict with keys: country, city, region, country_code.
    Returns _EMPTY on failure or private/unknown IPs (never raises).
    """
    if _is_private(ip):
        return _EMPTY

    if ip in _cache:
        return _cache[ip]

    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(
                f"http://ip-api.com/json/{ip}",
                params={"fields": "status,country,countryCode,regionName,city"},
            )
            data = resp.json()

        if data.get("status") == "success":
            result = {
                "country": data.get("country"),
                "city": data.get("city"),
                "region": data.get("regionName"),
                "country_code": data.get("countryCode"),
            }
        else:
            result = _EMPTY

    except Exception as exc:
        logger.debug("Geo lookup failed for %s: %s", ip, exc)
        result = _EMPTY

    _cache[ip] = result
    return result
