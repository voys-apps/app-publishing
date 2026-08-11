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

## Reddit post (tester recruit)

**Optional — only if the user asks** (or says yes after you propose it during closed testing).
Draft in chat + save `docs/reddit-closed-testing-post.txt` — **do not post** until user says to publish.

Prefer the Voys / r/AndroidClosedTesting style (same shape as Words Journey / QuickDoc):

```text
TITLE:
[Closed Testing] {AppName} — Need testers for {one-line pitch} (mutual testing welcome)

BODY:
Testers Needed
Hi everyone,

Looking for **testers** for **{AppName}**, an Android closed beta on Google Play. I need to hit the minimum tester count to keep the closed track active. Please help if you can!

**What it does:** {1–2 sentences: core loop / value}

**To join:**

Join our Google Group: https://groups.google.com/g/{groupSlug}

Opt in here: https://play.google.com/store/apps/details?id={packageName}

Web link: https://play.google.com/apps/testing/{packageName}

**Mutual testing:** Happy to test your app in return — just drop your Play link or Google Group in the comments and I'll opt in.

If you're up for it, I'd really appreciate the help. Feedback (bugs, UX, crashes{, sign-in, paywall}) is very welcome. Thanks!
```

Fill from live Play state when known: group email/slug, packageName, optional Day N / “N spots left”.
App-specific example: `docs/reddit-closed-testing-post.txt` (QuickDoc).

Post target: prefer a testers / Android beta community the user names (e.g. r/AndroidClosedTesting or a Voys-owned sub). Agent may open Reddit compose URL after approval; user clicks Submit unless they explicitly ask the agent to post via API/tooling.

## API verify checklist

```bash
cd scripts/play-console
pnpm testing:create-closed -- --dry-run
# or list tracks via edits.tracks.list in a small status script
```

Report: track name, type, release status, versionCodes, googleGroups.  
Confirm target is **`alpha`** (or user override) and **not** `receezy*`.
