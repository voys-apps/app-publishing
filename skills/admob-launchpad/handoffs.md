# AdMob — Console + EAS env

No AdMob API / OAuth in this skill.

| Step | Who | Action |
| --- | --- | --- |
| Open apps pages | Agent (skip if already open) | `pnpm console:open` |
| Create apps + units | User | AdMob UI |
| Paste `ca-app-pub-…` IDs | User → chat or `.env.local` | All `EXPO_PUBLIC_ADMOB_*` |
| Push to EAS | Agent | `pnpm eas:push` |

```bash
cd scripts/admob
# after IDs in ../../.env.local:
pnpm eas:push
```
