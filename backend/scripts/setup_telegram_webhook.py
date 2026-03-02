"""
Register the Telegram webhook URL with the Bot API.

Usage:
    cd backend
    python -m scripts.setup_telegram_webhook https://your-api.railway.app

This calls Telegram's setWebhook once. After that, Telegram sends all bot
messages to POST /api/integrations/telegram/webhook on your server.
"""
import asyncio
import secrets
import sys

from app.core.config import settings
from app.services.telegram import setup_webhook


async def main():
    if len(sys.argv) < 2:
        print("Usage: python -m scripts.setup_telegram_webhook <BASE_URL>")
        print("Example: python -m scripts.setup_telegram_webhook https://api.mindstash.app")
        sys.exit(1)

    base_url = sys.argv[1].rstrip("/")

    if not settings.TELEGRAM_BOT_TOKEN:
        print("ERROR: TELEGRAM_BOT_TOKEN is not set in .env")
        sys.exit(1)

    # Auto-generate webhook secret if not configured
    if not settings.TELEGRAM_WEBHOOK_SECRET:
        generated = secrets.token_urlsafe(32)
        print(f"No TELEGRAM_WEBHOOK_SECRET in .env — generated one:")
        print(f"  TELEGRAM_WEBHOOK_SECRET={generated}")
        print("Add this to your backend/.env, then re-run this script.\n")
        sys.exit(1)

    print(f"Setting webhook to: {base_url}/api/integrations/telegram/webhook")
    result = await setup_webhook(base_url)

    if result.get("ok"):
        print("Webhook registered successfully!")
    else:
        print(f"Failed: {result.get('description', result)}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
