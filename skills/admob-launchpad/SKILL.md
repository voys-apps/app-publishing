---
name: admob-launchpad
description: >-
  Open AdMob Console for Expo apps; user creates apps/units manually. After the
  user pastes ca-app-pub IDs, write EXPO_PUBLIC_ADMOB_* to .env.local and push
  them to EAS project env. No AdMob OAuth, no AdMob API create/list. Use when
  the user mentions AdMob, ca-app-pub, or admob-launchpad.
---

# AdMob Launchpad

**Console + EAS env only.** No AdMob API / OAuth.

```
Task Progress:
- [ ] 1. Open AdMob apps pages (correct Chrome profile if asked) — skip if already open
- [ ] 2. User creates Android + iOS apps + Banner/Native/Rewarded
- [ ] 3. User pastes App IDs + unit IDs in chat
- [ ] 4. Agent writes .env.local + `pnpm eas:push` (EAS env)
- [ ] 5. Remind: native rebuild for App ID plugin change
```

### Env keys (user pastes)

```text
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID
EXPO_PUBLIC_ADMOB_IOS_APP_ID
EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID
EXPO_PUBLIC_ADMOB_IOS_BANNER_ID
EXPO_PUBLIC_ADMOB_ANDROID_NATIVE_ID
EXPO_PUBLIC_ADMOB_IOS_NATIVE_ID
EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID
EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID
```

```bash
cd scripts/admob
pnpm console:open          # optional
pnpm eas:push              # after IDs are in .env.local or env
```

Templates: `templates/admob/` → `scripts/admob/`.
