"""
Quick test script to verify the updated categorizer produces conservative classifications.
Run: cd backend && python test_categorizer.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from app.services.ai.categorizer import categorize_item

# Test inputs — mix of problem cases and legitimate action items
TEST_INPUTS = [
    # These should get LOW priority, LOW urgency, action_required=false, frequency=never/weekly
    "Start waking up at 6 AM consistently",
    "Redis default port is 6379",
    "Remember the idea about auto-generated event badges",
    "Save that Tailwind animation snippet",
    "Sketch idea for a minimal bookmarking app",
    "Feeling productive after finishing the deployment today",
    "Try the coffee place Rahul mentioned near the station",
    "That Git command for undoing last commit without losing changes",

    # These SHOULD get action_required=true and appropriate frequency
    "Book dentist appointment next month",
    "Pay society light bill within 3 hours",
    "Remind me to take vitamins every day",
    "Meeting with client next Monday",
]

def main():
    print("=" * 100)
    print("MINDSTASH CATEGORIZER TEST — Verifying Conservative Classification")
    print("=" * 100)

    for i, input_text in enumerate(TEST_INPUTS, 1):
        print(f"\n{'─' * 100}")
        print(f"TEST {i}: \"{input_text}\"")
        print(f"{'─' * 100}")

        result = categorize_item(input_text)

        category = result.get("category", "?")
        priority = result.get("priority", "?")
        urgency = result.get("urgency", "?")
        action = result.get("action_required", "?")
        freq = result.get("notification_frequency", "?")
        notify = result.get("should_notify", "?")
        intent = result.get("intent", "?")
        reasoning = result.get("reasoning", "")

        # Color coding for terminal
        p_color = "\033[91m" if priority == "high" else "\033[93m" if priority == "medium" else "\033[92m"
        u_color = "\033[91m" if urgency == "high" else "\033[93m" if urgency == "medium" else "\033[92m"
        a_color = "\033[91m" if action else "\033[92m"
        f_color = "\033[91m" if freq == "daily" else "\033[93m" if freq == "weekly" else "\033[92m"
        reset = "\033[0m"

        print(f"  Category:        {category}")
        print(f"  Priority:        {p_color}{priority}{reset}")
        print(f"  Urgency:         {u_color}{urgency}{reset}")
        print(f"  Action Required: {a_color}{action}{reset}")
        print(f"  Frequency:       {f_color}{freq}{reset}")
        print(f"  Should Notify:   {notify}")
        print(f"  Intent:          {intent}")
        print(f"  Reasoning:       {reasoning[:80]}")

    print(f"\n{'=' * 100}")
    print("TEST COMPLETE")
    print(f"{'=' * 100}")


if __name__ == "__main__":
    main()
