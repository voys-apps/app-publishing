# Apply for production access — questionnaire (Console-only)

For **personal** Play developer accounts created after **13 Nov 2023**: after closed testing meets **≥12 opted-in testers for 14 continuous days**, Dashboard shows **Apply for production**. The user fills a 3-step form; Google reviews (usually ≤7 days).

**Official help:** [App testing requirements for new personal developer accounts](https://support.google.com/googleplay/android-developer/answer/14151465)

## Hard rule — no API

| Action | Supported? |
| --- | --- |
| Submit / PATCH questionnaire answers via Android Publisher API | **No** |
| Playwright / browser autofill of this form | **Do not** (unless user explicitly asks for browser automation) |
| Agent drafts paste-ready English answers | **Yes** |
| User pastes into Console and clicks **Apply** | **Yes** (account owner) |

When the user asks to “apply for production” / “production access cevapları”: **draft answers**, do **not** claim API can submit.

## Agent workflow

1. Confirm product type: **app** vs **game** (store category / Play “game” form wording).
2. Pull facts from the repo (listing copy, Reddit closed-test post, recent closed-track version bumps, known features). Prefer truth over generic fluff.
3. Output **English**, paste-ready blocks, each text field **≤300 characters** (Console counter).
4. Keep Part 1 feedback ↔ Part 3 changes **consistent** (same themes).
5. Radios: recruit ease + first-year installs — suggest one option; user may override.
6. If user pastes a step screenshot, answer **only that step** (or all three if they ask).
7. Never invent paid-tester vendors, fake crash rates, or “no issues / no changes” for every field.

## Form map (live Console)

Wording varies slightly: **app** vs **game** (“your app” / “your game”). Structure is the same.

### Part 1 — About your closed test

| # | Field | Type | Limit |
| --- | --- | --- | --- |
| 1 | How did you recruit users for your closed test? (friends/family, paid provider, communities, …) | text | 300 |
| 2 | How easy was it to recruit testers for your app/game? | radio | — |
| 3 | Describe the engagement you received from testers… (features used? like real users?) | text | 300 |
| 4 | Provide a summary of the feedback… Include how you collected it. | text | 300 |

**Recruit ease radios:** Very difficult · Difficult · Neither difficult or easy · Easy · Very easy  
(Voys default when Reddit + Group: **Difficult** or **Neither…** — be honest.)

### Part 2 — About your app/game

| # | Field | Type | Limit |
| --- | --- | --- | --- |
| 5 | Who is the intended audience of your app/game? | text | 300 |
| 6a | **App:** Describe how your app provides value to users | text | 300 |
| 6b | **Game:** Describe what makes your game stand out / unique | text | 300 |
| 7 | How many installs do you expect in your first year? | radio | — |

**Install radios (typical):** `0 - 10K` · `10K - 100K` · `100K - 1M` · `1M+` · `I don't know`  
Default suggestion for new indie launch: **`0 - 10K`** (honest). Answers here are **not** shown on Play and Google says they do **not** affect feature eligibility.

### Part 3 — Your production readiness

| # | Field | Type | Limit |
| --- | --- | --- | --- |
| 8 | What changes did you make to your app/game based on what you learned during closed test? | text | 300 |
| 9 | How did you decide that your app/game is ready for production? | text | 300 |

Optional later: if Google asked to continue testing, a follow-up “why ready this time?” may appear — acknowledge prior gaps + new engagement/builds.

Footer: **Discard** / **Back** / **Next** → final **Apply**. Discard without Apply does not save.

## App vs game — Part 2 only

| | **App** | **Game** |
| --- | --- | --- |
| Value question | How the product **helps users** (outcome + 2–3 concrete capabilities; quality bar) | What makes it **stand out** (loop, modes, art/progression, differentiation) |
| Audience | Role + problem + when they use it (not “everyone”) | Who plays + session style (casual/daily/competitive) |
| Engagement (Part 1) | Core flows: sign-in, main job-to-be-done, paywall/IAP if any | Core modes: levels, daily, timed modes, progression |

Parts 1 and 3 prompts are the same idea for both; only nouns flip (app/game).

## Answer skeletons (fill with project facts)

### Part 1 — recruit (≤300)

```
Recruited via a public Google Group and Reddit (r/TestersCommunity), plus friends/family. Shared Play opt-in and testing links, offered mutual testing, and kept 12+ opted-in testers for 14 continuous days.
```

### Part 1 — engagement (≤300)

```
Testers used {core features/modes}; {progress / return behavior}. Active play matched expected {session style}. Some mainly opted in with light use; engaged testers behaved like normal {users/players}.
```

### Part 1 — feedback (≤300)

```
Collected feedback via {Reddit comments / DMs / Play testing feedback / email}. Themes: {A}, {B}, {C}. We addressed {bugs/UX} in closed-track builds before applying for production.
```

### Part 2 — audience (≤300)

**App:** `{who}` who need `{job}` — e.g. adults managing {X} on mobile in short sessions. Not aimed at children under 13 unless true.

**Game:** Casual players who enjoy {genre} — teens/adults wanting short daily sessions; fans of {mechanic} who want {progression}.

### Part 2 — value / stand out (≤300)

**App:** `{App} helps users {outcome} by {capability1}, {capability2}, and {capability3}. {Monetization one-liner if relevant}.`

**Game:** `{Game} mixes {core loop} with {modes}. {Progression hook}. {UI/premium one-liner}.`

### Part 3 — changes (≤300)

```
Shipped closed-test updates: {fix1}, {UX2}, {feature3}. Addressed tester notes on {themes}; improved stability/onboarding before production.
```

### Part 3 — ready (≤300)

```
Met Play’s closed-test bar (12+ opted-in testers for 14 days). Core {flows/modes} exercised without blocking bugs. Store listing, Data Safety, and {IAP/ads} paths are set. Vitals look stable after iterative closed builds.
```

## Reference fill — Words Journey (game)

Use as a **pattern**, not a blind paste for other apps. Customize per product.

**Recruit:** Google Group + Reddit `r/TestersCommunity` + friends/family; 12+ for 14 days.  
**Ease:** Difficult (or Neither).  
**Engagement:** Journey, Daily Puzzle, Word Sprint; stars/streaks; short daily sessions.  
**Feedback:** Reddit/DMs; mode preference + challenge vs relax; UX/device issues → fixes.  
**Audience:** Casual word-puzzle players, teens/adults, letter-wheel fans.  
**Stand out:** Letter-wheel + Journey/Daily/Sprint; stars/streaks; Premium.  
**Installs:** `0 - 10K`.  
**Changes:** LetterBoard/gameplay fixes, home modes/progress UI, streak, hints/events, stability.  
**Ready:** 12/14 met; core modes exercised; listing/Data Safety/IAP/ads set; closed builds stable.

## Quality bar (avoid rejection)

- Specific channels, features, and feedback themes — not “testers liked it / no issues”.
- Part 1 feedback themes must match Part 3 changes.
- Cite real closed-track updates when the repo has them (version bumps during the 14 days help).
- Stay within **300** chars; trim before paste.
- English answers even if the user chats in Turkish.

## After Apply

- Review often finishes in about a week; email goes to the **account owner**.
- If rejected for more testing: keep ≥12 opted in, push engagement + builds, re-apply with a “what changed” narrative.
- Approval unlocks **Production** and **Open testing** in Console — still ship a production release separately (API `tracks` / Console rollout).
