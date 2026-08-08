# Coding conventions

Rules for skills, templates, and scripts in **app-publishing**. Agents and humans follow these when adding or editing code here.

## Goals

1. **Reusable across Voys Expo apps** — no hard-coded QuickDoc / FitCheck IDs in skills or templates.
2. **API over browser** — Play / ASC / RevenueCat via official APIs; Playwright only if the user insists and API cannot do it.
3. **Secrets never land in git** — document paths and env vars; do not commit JSON keys or `sk_` tokens.
4. **Small, copyable templates** — apps `cp -R` then edit catalogs; skill logic stays generic.

---

## Repo layout

| Path | Purpose |
| --- | --- |
| `skills/<name>/SKILL.md` | Agent entrypoint (YAML frontmatter + workflow) |
| `skills/<name>/*.md` | Deep notes (`api-constraints`, `scaffold`, `examples`, patterns) |
| `templates/<name>/` | Runnable scaffold copied into app repos |
| `docs/` | Human + agent meta (roadmap, conventions, stack) |

One concern per skill. Prefer extending an existing skill over a near-duplicate.

---

## Skill authoring

### Frontmatter

```yaml
---
name: skill-kebab-case
description: >-
  One dense paragraph: what it does, when to trigger (keywords), stack assumptions.
  Include product names users actually say (Play Console, RevenueCat, EAS, …).
---
```

- `name` matches folder name.
- `description` must be searchable; put triggers in the description, not only the body.

### Body shape (preferred order)

1. One-line purpose  
2. Install snippet (`npx skills add voys-apps/app-publishing --skill …`)  
3. When to use which tool (table)  
4. “Consult official docs” + URLs (mandatory for any API client work)  
5. Numbered workflow checklist  
6. Credentials table (env / paths — never example secrets)  
7. Repo / template convention  
8. Hard rules / traps  
9. Links to sibling `.md` files  

### Companion docs

| File | Use |
| --- | --- |
| `api-constraints.md` | Status codes, blocked legacy APIs, field gotchas |
| `scaffold.md` | How to create missing folders/files |
| `examples.md` | End-to-end flows with placeholder IDs |
| `*-patterns.md` | Language-specific code shape (e.g. Python for RC) |

If live docs disagree with skill notes, **prefer live docs**, then patch the skill.

### Language split (Voys default)

| Domain | Language | Why |
| --- | --- | --- |
| Google Play / ASC Node CLIs | **Node ESM (`.mjs`)** + `googleapis` / official clients | Matches existing `play-console` |
| RevenueCat catalog + Hosted UI | **Python 3.9+** (`urllib` / stdlib first) | Matches `rc-launchpad` |
| Interactive RC mutations in chat | **RevenueCat MCP** when connected | Prefer for one-off; scripts for repeatable |
| Supabase webhook stubs | **Deno / TypeScript** | Matches app edge functions |
| Skill docs | Markdown | — |

Do not scaffold Node for RC work unless the user explicitly asks. Do not scaffold Python for Play Console unless asked.

---

## Template / script style (Node `.mjs`)

### Package

- `"type": "module"`, `"private": true`
- Name: generic (`play-console-scripts`), not an app name
- Scripts: verb nouns — `auth:check`, `listing:upsert`, `testing:create-closed`

### Split config from logic

```text
src/client.mjs           # auth, API factory, formatApiError
src/catalog.mjs          # PACKAGE_NAME, products, prices  ← edit per app
src/listing-catalog.mjs  # store copy + contact            ← edit per app
src/assets-catalog.mjs   # image paths                     ← edit per app
src/<action>.mjs         # one CLI entry per concern
```

Placeholders only: `com.example.yourapp`, `support@example.com`, `testers@googlegroups.com`.

### Package manager

Use **pnpm** in all skill docs and template READMEs (`pnpm install`, `pnpm <script>`).
Do not document `npm run` / `npm install` for toolkit scripts.

### CLI UX

- Support `--dry-run` for mutating commands when practical
- Flags: `--track=`, `--group=` (equals form) + env fallbacks (`PLAY_CLOSED_TRACK`)
- Log: package name, key path (not key contents), edit/track IDs, success lines with `✓`
- On failure: `formatApiError(err)`, non-zero exit; delete open Play edits when safe

### Auth resolution order

1. `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`  
2. `GOOGLE_APPLICATION_CREDENTIALS`  
3. `secrets/play-api-service-account.json` (gitignored)

`secrets/.gitignore` ignores `*.json`; keep `secrets/README.md`.

The SA must be **GCP project Owner** on `project_id` in the JSON so agents can
enable APIs, bind IAM, and provision Pub/Sub (see play-launchpad / rc-launchpad).

### Money / listings

- Prices as USD strings in catalog; convert with shared `usdToMicros` / Money proto helpers
- Listing limits: title ≤30, short ≤80, full ≤4000 — validate with Unicode code-point length (`[...str].length`)
- Prefer monetization APIs (`onetimeproducts`, `subscriptions`) over legacy `inappproducts`

### Errors & Turkish

User-facing CLI messages may be Turkish or English; keep **identifiers and API field names in English**. Prefer English in templates shipped upstream; apps may localize log strings.

---

## Template / script style (Python — RC)

- Thin `rc_api.py` (auth, GET/PATCH/publish) + one script per action
- Env: `RC_API_KEY` or `RC_KEY_FILE`, `RC_PROJECT_ID`, `RC_PAYWALL_ID`
- Before new endpoints: fetch official REST v2 docs in the same turn
- No invented component fields — copy shapes from working paywalls / docs
- Selected-state overrides and sticky footers documented in skill constraints

---

## Product ID conventions (all Voys apps)

Use reverse-DNS, shared across iOS + Android when possible:

```text
com.<company>.<app>.pro.monthly
com.<company>.<app>.pro.yearly
com.<company>.<app>.credits10k
com.<company>.<app>.credits25k
…
```

RevenueCat:

- Entitlement marker: `pro` (unless app already differs — do not rename lightly)
- Offerings: `default` (subs), `credits` (consumables) when that pattern fits

Document exceptions in the **app** repo, not by forking skill logic.

---

## Docs tone

- Short, imperative, checklist-friendly
- Tables over long prose
- Link official vendor docs; don’t paste huge API schemas
- Roadmap items are checkboxes in `docs/ROADMAP.md` — update when shipping

---

## Git hygiene

- Never commit: `**/secrets/*.json`, `.env*`, raw AABs, keystores
- MIT license; copyright Voys Apps
- Commits: why-focused, conventional enough (`Add …`, `Fix …`, `Document …`)
- Do not force-push `main`

---

## Adding a new skill (checklist)

1. Create `skills/<name>/SKILL.md` with frontmatter + workflow  
2. Add constraint/scaffold companions as needed  
3. If runnable code is reusable → `templates/<name>/` with placeholder catalogs  
4. Link from root `README.md` “What’s inside” table  
5. Tick / add row in `docs/ROADMAP.md`  
6. Follow this file’s language split and secret rules  
7. Install path in skill body: `npx skills add voys-apps/app-publishing --skill <name>`
