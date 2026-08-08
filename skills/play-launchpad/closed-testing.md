# Closed testing — Google Group + Reddit (ask first)

## Hard rule

**Never** create a Google Group, assign Play testers, draft/publish a Reddit post, or
run `testing:create-closed` against a live track **without an explicit user “yes”**
in the current chat.

When closed testing is relevant, the agent must:

1. **Check Play API first** (`edits.tracks.list` / existing `testing:create-closed --dry-run`)
2. **Summarize** track status, version codes, existing `googleGroups`
3. **Propose** next steps (group name, Reddit draft) and **ask**
4. Only after confirmation: create group / assign / post

## Google Group (testers)

Play API only accepts **Google Groups** for closed testers (not raw email lists).

Suggested naming: `{app-slug}-closed@googlegroups.com` (or reuse existing Voys group).

| Step | How |
| --- | --- |
| Create group | Agent opens Groups UI; **user** creates (or confirms existing) |
| Join settings | Prefer invite / approved members for closed QA |
| Assign to track | `edits.testers.update` with `googleGroups: ["…@googlegroups.com"]` after user yes |

Open: `https://groups.google.com/my-groups`  
Play track (Console handoff if needed): Testing → Closed testing → Testers

## Reddit post (tester recruit)

Draft in chat for user approval — **do not post** until user says to publish.

Suggested structure:

```text
Title: [Closed test] {AppName} Android — looking for testers

Body:
We're opening a Google Play closed test for {AppName} ({packageName}).

How to join:
1. Join the Google Group: {groupEmail}
2. Opt in via the Play closed-testing link (we’ll reply / sticky with the link after Play shows it)
3. Install from Play (not sideload)

What we need: short feedback on install, sign-in, paywall/ads smoke test.
Region: {regions}. Build: {versionName}/{versionCode}.

Thanks — {team}
```

Post target: prefer a testers / Android beta community the user names (e.g. r/AndroidClosedTesting or a Voys-owned sub). Agent may open Reddit compose URL after approval; user clicks Submit unless they explicitly ask the agent to post via API/tooling.

## API verify checklist

```bash
cd scripts/play-console
pnpm testing:create-closed -- --dry-run
# or list tracks via edits.tracks.list in a small status script
```

Report: track name, type, release status, versionCodes, googleGroups.
