#!/usr/bin/env python3
"""
MindStash - Social Post Generator (Build in Public)

Triggered by git pre-push hook. Reads recent commits,
calls Claude API, generates X + LinkedIn post drafts.

Posts are saved to social-posts/YYYY-MM-DD.md
"""

import subprocess
import os
import sys
from datetime import datetime
from pathlib import Path

# Project root (script lives in scripts/)
PROJECT_ROOT = Path(__file__).parent.parent
SOCIAL_POSTS_DIR = PROJECT_ROOT / "social-posts"
MARKETING_GUIDE = PROJECT_ROOT / "MARKETING-BUILD-IN-PUBLIC.md"

# Try to load from backend .env
ENV_FILE = PROJECT_ROOT / "backend" / ".env"


def load_api_key():
    """Load Anthropic API key from environment or backend .env file."""
    key = os.environ.get("ANTHROPIC_API_KEY")
    if key:
        return key

    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line.startswith("ANTHROPIC_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")

    return None


def get_commits_since_last_push():
    """Get all commits that are about to be pushed."""
    # Use record separator (%x00) to split commits cleanly
    fmt = "%H%x01%s%x01%ai%x00"
    try:
        # Get commits that exist locally but not on remote
        result = subprocess.run(
            ["git", "log", "@{push}..", f"--pretty=format:{fmt}", "--no-merges"],
            capture_output=True, text=True, cwd=PROJECT_ROOT
        )
        if result.returncode != 0 or not result.stdout.strip():
            # Fallback: get last 5 commits
            result = subprocess.run(
                ["git", "log", "-5", f"--pretty=format:{fmt}", "--no-merges"],
                capture_output=True, text=True, cwd=PROJECT_ROOT
            )
    except Exception:
        # Final fallback: just get the latest commit
        result = subprocess.run(
            ["git", "log", "-1", f"--pretty=format:{fmt}"],
            capture_output=True, text=True, cwd=PROJECT_ROOT
        )

    commits = []
    for record in result.stdout.strip().split("\x00"):
        record = record.strip()
        if not record:
            continue
        parts = record.split("\x01")
        if len(parts) >= 2:
            commits.append({
                "hash": parts[0][:8],
                "subject": parts[1],
                "date": parts[2] if len(parts) > 2 else "",
            })

    return commits


def get_diff_stat():
    """Get a summary of what changed (files, insertions, deletions)."""
    try:
        result = subprocess.run(
            ["git", "diff", "--stat", "@{push}.."],
            capture_output=True, text=True, cwd=PROJECT_ROOT
        )
        if result.returncode != 0 or not result.stdout.strip():
            result = subprocess.run(
                ["git", "diff", "--stat", "HEAD~1"],
                capture_output=True, text=True, cwd=PROJECT_ROOT
            )
        return result.stdout.strip()
    except Exception:
        return "Unable to get diff stats"


def get_files_changed():
    """Get list of files that changed (names only)."""
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", "@{push}.."],
            capture_output=True, text=True, cwd=PROJECT_ROOT
        )
        if result.returncode != 0 or not result.stdout.strip():
            result = subprocess.run(
                ["git", "diff", "--name-only", "HEAD~1"],
                capture_output=True, text=True, cwd=PROJECT_ROOT
            )
        return result.stdout.strip()
    except Exception:
        return ""


def get_current_branch():
    """Get the current git branch name."""
    result = subprocess.run(
        ["git", "branch", "--show-current"],
        capture_output=True, text=True, cwd=PROJECT_ROOT
    )
    return result.stdout.strip()


def generate_posts(api_key, commits, diff_stat, files_changed, branch):
    """Call Claude API to generate social media posts."""
    try:
        import anthropic
    except ImportError:
        print("ERROR: anthropic package not installed.")
        print("Run: pip install anthropic")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    # Build commit summary
    commit_summary = "\n".join(
        f"- {c['subject']} ({c['date'].split(' ')[0] if c['date'] else 'today'})"
        for c in commits
    )

    prompt = f"""You are a social media content creator for a developer building "MindStash" in public.

MindStash is an AI-powered second brain app. Users type any thought (max 500 chars), and AI automatically categorizes it into 12 smart categories, predicts when to remind them, and resurfaces forgotten thoughts at the right time. Tech stack: FastAPI + Next.js + Claude AI + PostgreSQL + pgvector.

The developer just pushed code. Here's what changed:

BRANCH: {branch}
COMMITS:
{commit_summary}

FILES CHANGED:
{files_changed}

DIFF STATS:
{diff_stat}

Generate exactly 2 posts based on this push:

1. **X/Twitter post** (max 280 chars, punchy, use 1-2 relevant hashtags from: #buildinpublic #ai #llm #rag #nextjs #fastapi #python #typescript #saas #indiehacker)

2. **LinkedIn post** (3-6 short paragraphs, professional but authentic, storytelling angle, end with a question or call to engagement)

RULES:
- Make it about the HUMAN IMPACT, not just code changes. "Added pgvector" → "My app can now find forgotten thoughts by meaning, not just keywords"
- Be specific about what was built - use real details from the commits
- Sound like a real developer sharing progress, NOT a marketing bot
- If commits are small/trivial (typos, config), focus on the bigger journey/context instead
- Don't use cringe phrases like "excited to announce" or "thrilled to share"
- Don't use emojis excessively (1-2 max per post)
- Include a "building in public" angle - the journey, the struggle, the learning
- Pick the most relevant content pillar for each post:
  - "The Problem": relatable pain point about losing thoughts
  - "The Build": what you built today and why it matters
  - "The AI Magic": something impressive the AI does
  - "The Lessons": something you learned building this

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

### X/Twitter

[post content here]

### LinkedIn

[post content here]

### Pillar Used

X: [pillar name]
LinkedIn: [pillar name]
"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    return response.content[0].text


def save_posts(content, commits, branch):
    """Save generated posts to social-posts/YYYY-MM-DD.md"""
    SOCIAL_POSTS_DIR.mkdir(exist_ok=True)

    today = datetime.now().strftime("%Y-%m-%d")
    time_now = datetime.now().strftime("%H:%M")
    filepath = SOCIAL_POSTS_DIR / f"{today}.md"

    commit_refs = ", ".join(c["hash"] for c in commits[:5])
    commit_subjects = "\n".join(f"  - {c['subject']}" for c in commits[:5])

    entry = f"""
---

## Push at {time_now} | Branch: `{branch}` | Commits: {commit_refs}

**What was pushed:**
{commit_subjects}

{content}

**Status:** Draft - Review before posting

---
"""

    if filepath.exists():
        # Append to existing file
        existing = filepath.read_text()
        filepath.write_text(existing + entry)
    else:
        # Create new file with header
        header = f"# MindStash - Social Posts for {today}\n\n"
        header += "> Auto-generated from git push. Review, tweak, then post.\n"
        header += f"> Generated using Claude Haiku 4.5\n"
        filepath.write_text(header + entry)

    return filepath


def main():
    print("\n📝 MindStash Social Post Generator")
    print("=" * 40)

    # Load API key
    api_key = load_api_key()
    if not api_key:
        print("WARNING: No ANTHROPIC_API_KEY found. Skipping post generation.")
        print("Set it in your environment or in backend/.env")
        sys.exit(0)  # Exit 0 so it doesn't block the push

    # Get git info
    branch = get_current_branch()
    commits = get_commits_since_last_push()
    if not commits:
        print("No new commits to generate posts for. Skipping.")
        sys.exit(0)

    diff_stat = get_diff_stat()
    files_changed = get_files_changed()

    print(f"Branch: {branch}")
    print(f"Commits: {len(commits)}")
    for c in commits[:5]:
        print(f"  - {c['subject']}")

    # Generate posts
    print("\nGenerating posts with Claude...")
    try:
        content = generate_posts(api_key, commits, diff_stat, files_changed, branch)
    except Exception as e:
        print(f"WARNING: Post generation failed: {e}")
        print("Push will continue. Generate posts manually later.")
        sys.exit(0)  # Don't block the push

    # Save posts
    filepath = save_posts(content, commits, branch)
    print(f"\nPosts saved to: {filepath}")
    print("Review and post when ready!")
    print("=" * 40)


if __name__ == "__main__":
    main()
