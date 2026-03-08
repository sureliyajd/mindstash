"""
Test script for daily briefing email functionality.

Tests:
1. Generating AI briefing for a user
2. Sending briefing via email
3. Full daily briefing flow

Usage:
    cd backend
    python3 test_daily_briefing.py
"""
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.core.database import SessionLocal
# Import all models to ensure SQLAlchemy relationship resolution
from app.models import User, Item, ChatSession, ChatMessage, UserMemory, TelegramLink, PendingConfirmation
from app.services.notifications.daily_briefing import (
    generate_briefing_for_user,
    send_daily_briefing_to_user,
    send_daily_briefings
)

def test_generate_briefing():
    """Test generating a briefing for first user"""
    print("\n" + "="*60)
    print("TEST 1: Generate AI Briefing")
    print("="*60)

    db = SessionLocal()
    try:
        # Get first user
        user = db.query(User).first()
        if not user:
            print("❌ No users found in database")
            print("   Create a user first via /api/auth/register")
            return False

        print(f"📧 Generating briefing for: {user.email}")
        print("⏳ Calling AI agent... (this may take 10-30 seconds)")

        briefing_text = generate_briefing_for_user(user.id, db)

        if briefing_text:
            print("\n✅ Briefing generated successfully!")
            print("\n" + "-"*60)
            print("BRIEFING CONTENT:")
            print("-"*60)
            print(briefing_text)
            print("-"*60)
            return True
        else:
            print("❌ Failed to generate briefing")
            return False

    finally:
        db.close()


def test_send_briefing_email():
    """Test sending briefing email to first user"""
    print("\n" + "="*60)
    print("TEST 2: Send Briefing Email")
    print("="*60)

    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("❌ No users found")
            return False

        print(f"📧 Sending daily briefing to: {user.email}")
        print("⏳ Generating and sending email...")

        success = send_daily_briefing_to_user(user, db)

        if success:
            print("\n✅ Daily briefing email sent successfully!")
            print(f"   Check inbox: {user.email}")
            return True
        else:
            print("❌ Failed to send briefing email")
            return False

    finally:
        db.close()


def test_send_all_briefings():
    """Test sending briefings to all users"""
    print("\n" + "="*60)
    print("TEST 3: Send Briefings to All Users")
    print("="*60)

    db = SessionLocal()
    try:
        result = send_daily_briefings(db)

        print(f"\n📊 Results:")
        print(f"   Total users: {result['total_users']}")
        print(f"   Briefings sent: {result['briefings_sent']}")
        print(f"   Failed: {result['failed']}")

        if result['briefings_sent'] > 0:
            print("\n✅ Daily briefings sent successfully!")
            return True
        else:
            print("❌ No briefings were sent")
            return False

    finally:
        db.close()


def main():
    """Run all tests"""
    print("\n🧪 MindStash Daily Briefing Test Suite")
    print("="*60)

    # Check if RESEND_API_KEY is configured
    import os
    if not os.getenv("RESEND_API_KEY"):
        print("\n⚠️  WARNING: RESEND_API_KEY not configured")
        print("   Emails will not be sent (test mode only)")

    if not os.getenv("ANTHROPIC_API_KEY"):
        print("\n❌ ERROR: ANTHROPIC_API_KEY not configured")
        print("   AI agent cannot generate briefings")
        sys.exit(1)

    tests = [
        ("Generate Briefing", test_generate_briefing),
        ("Send Briefing Email", test_send_briefing_email),
        # Uncomment to test sending to all users:
        # ("Send All Briefings", test_send_all_briefings),
    ]

    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ Test failed with exception: {e}")
            results.append((test_name, False))

    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")

    passed = sum(1 for _, result in results if result)
    total = len(results)
    print(f"\nPassed: {passed}/{total}")

    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
