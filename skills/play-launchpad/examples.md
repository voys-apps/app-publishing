# Play Launchpad — examples

## Example A — New app, first closed test

User: “Play’de closed test aç, grup X, son AAB”

1. Confirm `PACKAGE_NAME` and SA path.
2. `npm run auth:check`
3. Ensure listing + icon exist (draft apps still need minimum store presence).
4. `npm run testing:create-closed -- --track=qa-closed --group=x@googlegroups.com`
5. If commit fails with draft-app error → leave release as `draft`, tell user
   Console → Closed testing → Start rollout after first-launch checklist.

## Example B — Upsert credit packs

User: “5 kredi paketini Play’e ekle”

1. Fill `catalog.mjs` SKUs/prices/copy from product docs (or ask once for table).
2. `npm run products:upsert-credits`
3. Activate DRAFT purchase options via `batchUpdateStates`.
4. List products; report ACTIVE skus.

## Example C — Listing + graphics

User: “TR isim şu olsun, screenshot bunları, feature graphic üret”

1. Update `listing-catalog.mjs` titles (≤30) + short (≤80).
2. `GenerateImage` for marketing banner → crop/resample to **1024×500**.
3. Stage screenshots under `assets/play-store/`.
4. `npm run listing:upsert` then `npm run listing:upload-assets`.
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
