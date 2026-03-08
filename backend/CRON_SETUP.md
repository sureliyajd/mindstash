# MindStash Cron Jobs Setup Guide

This guide explains how to set up automated scheduled tasks (cron jobs) for MindStash email features.

## Overview

MindStash has 3 scheduled email tasks:

| Task | Frequency | Time (UTC) | Endpoint |
|------|-----------|------------|----------|
| **Daily Briefings** | Every day | 8:00 AM | `POST /api/notifications/send-briefings` |
| **Notification Reminders** | Every 15 minutes | * | `POST /api/notifications/process` |
| **Weekly Digest** | Every Sunday | 9:00 AM | `POST /api/notifications/send-digests` |

---

## Security: API Key Authentication

All cron endpoints require the `X-API-Key` header in production.

### Generate a Secure API Key

```bash
# Generate a random 32-character key
openssl rand -hex 32
# Example output: a1b2c3d4e5f6...
```

### Add to Environment Variables

```bash
# In your .env or production config:
CRON_API_KEY=your_generated_key_here
```

---

## Option 1: Railway Cron Jobs (Recommended)

If deploying to Railway, use their built-in cron service.

### Setup Steps:

1. **In Railway Dashboard:**
   - Go to your project
   - Click "New" → "Cron Job"

2. **Add Daily Briefing Job:**
   ```
   Name: Send Daily Briefings
   Schedule: 0 8 * * *
   Command: curl -X POST -H "X-API-Key: $CRON_API_KEY" https://your-api.up.railway.app/api/notifications/send-briefings
   ```

3. **Add Notification Processing Job:**
   ```
   Name: Process Notifications
   Schedule: */15 * * * *
   Command: curl -X POST -H "X-API-Key: $CRON_API_KEY" https://your-api.up.railway.app/api/notifications/process
   ```

4. **Add Weekly Digest Job:**
   ```
   Name: Send Weekly Digests
   Schedule: 0 9 * * 0
   Command: curl -X POST -H "X-API-Key: $CRON_API_KEY" https://your-api.up.railway.app/api/notifications/send-digests
   ```

5. **Set CRON_API_KEY Environment Variable:**
   - In Railway dashboard → Variables
   - Add: `CRON_API_KEY=your_generated_key`

---

## Option 2: Vercel Cron Jobs

If your backend is on Vercel, use `vercel.json` configuration.

### Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/notifications/send-briefings",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/notifications/process",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/notifications/send-digests",
      "schedule": "0 9 * * 0"
    }
  ]
}
```

**Note:** Vercel cron uses `CRON_SECRET` instead of custom headers. Update your auth logic accordingly.

---

## Option 3: GitHub Actions

Use GitHub Actions workflows to trigger cron jobs.

### Create `.github/workflows/daily-briefings.yml`:

```yaml
name: Send Daily Briefings

on:
  schedule:
    - cron: '0 8 * * *'  # 8 AM UTC daily
  workflow_dispatch:  # Manual trigger

jobs:
  send-briefings:
    runs-on: ubuntu-latest
    steps:
      - name: Send Daily Briefings
        run: |
          curl -X POST \
            -H "X-API-Key: ${{ secrets.CRON_API_KEY }}" \
            https://your-api.example.com/api/notifications/send-briefings
```

Repeat for notifications and digests with appropriate schedules.

**Add Secret:**
- Go to GitHub repo → Settings → Secrets → Actions
- Add `CRON_API_KEY` with your generated key

---

## Option 4: Linux Crontab (Self-Hosted)

If self-hosting on a Linux server.

### Edit crontab:

```bash
crontab -e
```

### Add these lines:

```bash
# Daily briefings at 8 AM UTC
0 8 * * * curl -X POST -H "X-API-Key: YOUR_KEY" https://your-api.com/api/notifications/send-briefings

# Process notifications every 15 minutes
*/15 * * * * curl -X POST -H "X-API-Key: YOUR_KEY" https://your-api.com/api/notifications/process

# Weekly digest every Sunday at 9 AM UTC
0 9 * * 0 curl -X POST -H "X-API-Key: YOUR_KEY" https://your-api.com/api/notifications/send-digests
```

Replace `YOUR_KEY` with your actual `CRON_API_KEY`.

---

## Option 5: In-Process Scheduler (Local Development)

For local development or single-server deployments, use APScheduler (already implemented).

### Install APScheduler:

```bash
pip install apscheduler
```

### Enable in main.py:

```python
from app.services.scheduler import start_scheduler, stop_scheduler

@app.on_event("startup")
async def startup():
    start_scheduler()

@app.on_event("shutdown")
async def shutdown():
    stop_scheduler()
```

**Note:** This runs jobs in the same process as your API. Not recommended for production (use external cron instead).

---

## Cron Schedule Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### Common Schedules:

| Description | Schedule |
|-------------|----------|
| Every 15 minutes | `*/15 * * * *` |
| Every hour | `0 * * * *` |
| Every day at 8 AM | `0 8 * * *` |
| Every Sunday at 9 AM | `0 9 * * 0` |
| Every Monday at 10 AM | `0 10 * * 1` |

---

## Testing Cron Endpoints

### Local Testing (No API Key):

```bash
# Start your backend
uvicorn app.main:app --reload --port 8000

# Test daily briefings
curl -X POST http://localhost:8000/api/notifications/send-briefings

# Test notifications
curl -X POST http://localhost:8000/api/notifications/process

# Test digest
curl -X POST http://localhost:8000/api/notifications/send-digests
```

### Production Testing (With API Key):

```bash
# Replace YOUR_KEY and YOUR_DOMAIN
curl -X POST \
  -H "X-API-Key: YOUR_KEY" \
  https://YOUR_DOMAIN/api/notifications/send-briefings
```

---

## Monitoring Cron Jobs

### Check Logs:

**Railway:**
- Dashboard → Your Service → Logs
- Filter by "daily briefing" or "digest"

**Vercel:**
- Dashboard → Functions → Logs

**Self-Hosted:**
```bash
tail -f /var/log/mindstash.log
```

### Success Indicators:

Look for these log messages:
```
☀️ Running daily briefing job at 2026-03-08T08:00:00
   Sent 15 briefings, 0 failed

🔔 Running notification job at 2026-03-08T09:15:00
   Processed 3 notifications

📬 Running digest job at 2026-03-08T09:00:00
   Sent 12 digests, skipped 3
```

---

## Troubleshooting

### Issue: "Invalid API key"

**Solution:** Check that `CRON_API_KEY` matches in:
1. Environment variables (backend)
2. Cron job headers (curl command)

### Issue: "No briefings sent"

**Possible causes:**
1. No users in database
2. `ANTHROPIC_API_KEY` not configured
3. `RESEND_API_KEY` not configured

**Check logs** for specific error messages.

### Issue: Jobs not running

**Railway:** Check cron job status in dashboard
**Vercel:** Verify `vercel.json` is committed to repo
**GitHub Actions:** Check Actions tab for workflow runs
**Crontab:** Check cron is running: `systemctl status cron`

---

## Time Zones

All schedules are in **UTC**. Convert to your local time:

| UTC | EST | PST | IST |
|-----|-----|-----|-----|
| 8:00 AM | 3:00 AM | 12:00 AM | 1:30 PM |
| 9:00 AM | 4:00 AM | 1:00 AM | 2:30 PM |

**To change briefing time:**
- Modify cron schedule (e.g., `0 13 * * *` for 1 PM UTC = 8 AM EST)

---

## Cost Implications

**Email Costs (Resend):**
- Free tier: 3,000 emails/month
- With 50 users:
  - Daily briefings: 50 × 30 = 1,500 emails/month
  - Weekly digests: 50 × 4 = 200 emails/month
  - Notifications: varies (estimate 300/month)
  - **Total:** ~2,000 emails/month (within free tier)

**Compute Costs:**
- Railway/Vercel cron: Included in plan
- GitHub Actions: Free for public repos
- Self-hosted: Negligible CPU usage

---

## Next Steps

1. ✅ Choose a cron option (Railway recommended)
2. ✅ Generate and set `CRON_API_KEY`
3. ✅ Configure cron jobs with proper schedules
4. ✅ Test endpoints manually first
5. ✅ Monitor logs for first automated run
6. ✅ Adjust schedules based on user timezone if needed

---

**Questions?** Check backend logs or test endpoints with `test_daily_briefing.py` script.
