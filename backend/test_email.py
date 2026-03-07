"""
Quick test script to verify Resend email integration is working.

Usage:
    cd backend
    python test_email.py your-email@example.com
"""
import sys
import os
from dotenv import load_dotenv
import resend

# Load environment variables
load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

if not resend.api_key:
    print("❌ Error: RESEND_API_KEY not found in .env")
    sys.exit(1)

# Get recipient email from command line or use default
recipient = sys.argv[1] if len(sys.argv) > 1 else "test@example.com"

print(f"\n📧 Testing email delivery to: {recipient}")
print(f"   From: {os.getenv('FROM_EMAIL', 'noreply@mindstash.heyjaydeep.website')}")
print(f"   API Key: {resend.api_key[:10]}...{resend.api_key[-4:]}")

# Test email with nice formatting
params = {
    "from": os.getenv("FROM_EMAIL", "noreply@mindstash.heyjaydeep.website"),
    "to": [recipient],
    "subject": "✅ MindStash Email Test - Success!",
    "html": """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                       color: white; padding: 40px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 40px; border-radius: 0 0 12px 12px; }
            .success-box { background: #d1fae5; border: 2px solid #34d399; padding: 20px;
                          border-radius: 8px; margin: 20px 0; text-align: center; }
            .info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0;
                   border-left: 4px solid #667eea; }
            .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 32px;">🧠 MindStash</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Email Delivery Test</p>
            </div>
            <div class="content">
                <div class="success-box">
                    <h2 style="color: #059669; margin: 0;">✅ Email Delivery Working!</h2>
                    <p style="margin: 10px 0 0 0; color: #047857;">
                        If you're reading this, Resend is configured correctly.
                    </p>
                </div>

                <h3 style="color: #667eea; margin-top: 30px;">What This Means:</h3>

                <div class="info">
                    <strong>✉️ Notifications Ready</strong>
                    <p style="margin: 5px 0 0 0; color: #6b7280;">
                        Users will receive email reminders when their saved items are due.
                    </p>
                </div>

                <div class="info">
                    <strong>📊 Weekly Digests Ready</strong>
                    <p style="margin: 5px 0 0 0; color: #6b7280;">
                        Users will get a Sunday morning summary of urgent items and pending tasks.
                    </p>
                </div>

                <div class="info">
                    <strong>🚀 Next Steps</strong>
                    <p style="margin: 5px 0 0 0; color: #6b7280;">
                        Deploy to production and set up cron jobs for automated sending.
                    </p>
                </div>

                <div class="footer">
                    <p>This is a test email from your local development environment</p>
                    <p style="margin-top: 10px; color: #d1d5db;">
                        MindStash Email Delivery Test • Powered by Resend
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """,
}

try:
    print("\n⏳ Sending test email...")
    response = resend.Emails.send(params)

    print("\n✅ SUCCESS! Email sent successfully!")
    print(f"   Email ID: {response.get('id')}")
    print(f"\n💡 Check your inbox at: {recipient}")
    print("   (Email may take 10-30 seconds to arrive)")
    print("\n🎉 Email delivery is configured correctly!")

except Exception as e:
    print(f"\n❌ ERROR: Failed to send email")
    print(f"   {str(e)}")
    print("\nTroubleshooting:")
    print("1. Check that RESEND_API_KEY is correct in .env")
    print("2. Verify domain is verified in Resend dashboard")
    print("3. Check FROM_EMAIL matches your verified domain")
    sys.exit(1)
