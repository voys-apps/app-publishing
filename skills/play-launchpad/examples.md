# Play Launchpad — examples

## Example A — Next build on alpha (do not touch receezy)

User: “Yeni AAB’yi closed/alpha’ya at”

1. Confirm `PACKAGE_NAME` and SA path.
2. `pnpm auth:check` + list tracks (`--dry-run`).
3. If **`alpha`** exists → propose upload there. If only `receezy*` exists → **do not
   use it**; ask the user (never create a new track).
4. After yes: `pnpm testing:upload-aab -- --aab=… --track=alpha --status=completed`
   (optional `--group=` only if user confirmed).
5. If commit fails with draft-app error → leave release as `draft`, tell user
   Console → Start rollout after first-launch checklist.

## Example B — Upsert credit packs

User: “5 kredi paketini Play’e ekle”

1. Fill `catalog.mjs` SKUs/prices/copy from product docs (or ask once for table).
2. `pnpm products:upsert-credits`
3. Activate DRAFT purchase options via `batchUpdateStates`.
4. List products; report ACTIVE skus.

## Example C — Listing + graphics

User: “TR isim şu olsun, screenshot bunları, feature graphic üret”

1. Update `listing-catalog.mjs` titles (≤30) + short (≤80).
2. `GenerateImage` for marketing banner → crop/resample to **1024×500**.
3. Stage screenshots under `assets/play-store/`.
4. `pnpm listing:upsert` then `pnpm listing:upload-assets`.
5. Verify image counts via `edits.images.list`.

## Example D — Wrong tool

User: “Play Console formlarını Playwright ile doldur”

→ Decline form-filling automation when API covers it. Use Play Launchpad API
flow instead. Only use browser automation for Console-only first-publish steps
the API explicitly cannot complete.

## Example E — Cross-project reuse

User opens a different Expo app without `scripts/play-console/`.

1. Scaffold from [scaffold.md](scaffold.md).
2. Copy catalog values from that app’s store docs / RevenueCat product IDs.
3. Point SA JSON at that app’s Play-linked Cloud project; confirm SA is **GCP Owner**.
4. Run `auth:check` before any mutation. On Service Usage `403`, ask for Owner then retry.

## Example F — Enable Pub/Sub for RevenueCat (Owner SA)

User: “RC Pub/Sub hatası / RTDN”

1. Confirm SA JSON is Owner on `project_id`.
2. Run app helper (or Service Usage + IAM + topic create via SA).
3. Hand Topic ID to user for Play Monetization setup paste (API cannot).

## Example G — Reddit closed-testing recruit (optional)

User: “Day 6 oldu, r/TestersCommunity’ye post aç” / “Reddit post query params ile aç”

1. Confirm optional Reddit recruit is requested (do not invent a post unprompted).
2. Write/update `docs/reddit-closed-testing-post.txt` with Day N/14 copy from Play status.
3. Build `https://www.reddit.com/r/TestersCommunity/submit?title=…&text=…` and `open` it.
4. User clicks Post — see [closed-testing.md](./closed-testing.md) “Open Reddit compose”.

## Example H — Apply for production questionnaire (Console-only)

User: “Production’a başvuracağım, cevapları yaz” / “Apply for production — app mı game mi”

1. Confirm **app vs game**. API **cannot** submit — draft only.
2. Read [production-access.md](./production-access.md); pull recruit channel, features, and recent closed builds from the repo.
3. Paste-ready **English** answers, each text field **≤300** chars; suggest recruit-ease + install radios.
4. User pastes in Console → **Apply**. Do not Playwright-fill unless explicitly asked.
