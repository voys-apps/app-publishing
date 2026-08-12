# Closed testing — tracks, Google Group + Reddit (ask first)

## Track policy (Voys / QuickDoc)

| Rule | Detail |
| --- | --- |
| **Do not touch `receezy` / `receezy-closed`** | Leave that closed track alone — no AAB upload, no testers update, no release mutate, no recreate. It stays as-is for its own tester pool. |
| **Prefer existing `alpha`** | For the next / ongoing app builds, upload to the **`alpha`** track **if it already exists**. |
| **Never create tracks** | Do **not** call `edits.tracks.create`. Do **not** invent custom `CLOSED_TESTING` track names. If the needed track is missing, **stop and ask the user** (Console or explicit instruction). |
| **List first** | Always `edits.tracks.list` (or `testing:* --dry-run`) before upload. Report track names + status, then proceed only on an allowed existing track. |

**Default target:** `alpha` (when present). Override with `--track=` / `PLAY_CLOSED_TRACK` only when the user names a non-`receezy*` track that already exists.

## Hard rule (mutations)

**Never** create a Google Group, assign Play testers, draft/publish a Reddit post, or
run `testing:create-closed` / `testing:upload-aab` against a live track **without an
explicit user “yes”** in the current chat (except dry-run / list-only).

When closed testing is relevant, the agent must:

1. **Check Play API first** (`edits.tracks.list` / `testing:* --dry-run`)
2. **Summarize** track status, version codes, existing `googleGroups` — call out that **`receezy*` is off-limits**
3. **Propose** upload to **`alpha`** (if it exists) + optional group / Reddit draft and **ask**
4. Only after confirmation: upload / assign / post — **still no track create**, **still no `receezy*`**

## Google Group (testers)

Play API only accepts **Google Groups** for closed testers (not raw email lists).

Suggested naming: `{app-slug}-closed@googlegroups.com` (or an existing Voys group).
Do **not** assume `receezy@googlegroups.com` is the default for `alpha` — pass `--group=` /
`PLAY_CLOSED_GROUP` only when the user confirms.

| Step | How |
| --- | --- |
| Create group | Agent opens Groups UI; **user** creates (or confirms existing) |
| Join settings | Prefer invite / approved members for closed QA |
| Assign to track | `edits.testers.update` on **`alpha`** (or user-named existing track) with `googleGroups: ["…@googlegroups.com"]` after user yes |

Open: `https://groups.google.com/my-groups`  
Play track (Console handoff if needed): Testing → Closed testing / Alpha → Testers

## Reddit post (tester recruit) — optional, open compose via query params

**Optional — only if the user asks** (or says yes after you propose it during closed testing).
Do **not** auto-post. Default flow: draft → save file → **open prefilled Reddit compose** → user clicks Submit.

### Default subreddit

**`r/TestersCommunity`** unless the user names another (e.g. r/AndroidClosedTesting).

### Day-N updates (14-day Play rule)

When Play Console shows continuous opt-in progress (e.g. “12 testers … for N days”), rewrite the post as a **Day N/14** update:

- Keep links + mutual-testing offer
- State current count + days continuous + days remaining
- Ask for **extra opt-ins as buffer** so the 12-for-14 streak does not drop
- Save to `docs/reddit-closed-testing-post.txt` in the app repo

### Template

```text
TITLE:
[Closed Testing] {AppName} — Day {N}/14: Need testers to keep the Play closed track alive (mutual testing welcome)

BODY:
Testers Needed
Hi everyone,

**Day {N} update** — Google Play needs **at least 12 testers opted in for 14 continuous days**. We're currently at **{count} testers for {N} days**, so we still need **{14-N} more days** without dropping below 12. Extra opt-ins are a huge help as a buffer if anyone leaves.

**What it does:** {1–2 sentences: core loop / value}

**To join:**

Join our Google Group: https://groups.google.com/g/{groupSlug}

Opt in here: https://play.google.com/store/apps/details?id={packageName}

Web link: https://play.google.com/apps/testing/{packageName}

**Mutual testing:** Happy to test your app in return — just drop your Play link or Google Group in the comments and I'll opt in.

If you can opt in (and leave the tester membership on), I'd really appreciate it. Feedback (bugs, UX, crashes{, sign-in, paywall}) is very welcome. Thanks!
```

First-recruit (no day counter yet) may omit Day N and use “Need testers for {pitch}” in the title.

### Open Reddit compose (query params) — “şak diye aç”

After the user asks to open / publish draft:

1. Parse `docs/reddit-closed-testing-post.txt` → `TITLE:` line + `BODY:` block (everything after `BODY:`).
2. Build:

```text
https://www.reddit.com/r/{sub}/submit?title={encodeURIComponent(title)}&text={encodeURIComponent(body)}
```

Default `{sub}` = `TestersCommunity`.

3. Open in the browser (macOS: `open "<url>"`). Print the same URL in chat.
4. User reviews flair / rules and clicks **Post**. Agent does **not** submit via Reddit API unless the user explicitly asks.

Shell one-liner (from app repo, after the txt exists):

```bash
python3 - <<'PY'
from pathlib import Path
from urllib.parse import quote
import subprocess, re, sys

raw = Path("docs/reddit-closed-testing-post.txt").read_text()
m = re.search(r"(?ms)^TITLE:\s*(.+?)\n\s*\nBODY:\s*\n(.*)\Z", raw.strip() + "\n")
if not m:
    sys.exit("Could not parse TITLE/BODY from docs/reddit-closed-testing-post.txt")
title, body = m.group(1).strip(), m.group(2).strip()
sub = "TestersCommunity"  # override if user named another
url = f"https://www.reddit.com/r/{sub}/submit?title={quote(title)}&text={quote(body)}"
print(url)
subprocess.run(["open", url], check=False)
PY
```

If the URL is extremely long and the browser truncates, fall back to: open `https://www.reddit.com/r/{sub}/submit`, paste title/body from the txt (still no auto-submit).

## API verify checklist

```bash
cd scripts/play-console
pnpm testing:create-closed -- --dry-run
# or list tracks via edits.tracks.list in a small status script
```

Report: track name, type, release status, versionCodes, googleGroups.  
Confirm target is **`alpha`** (or user override) and **not** `receezy*`.
