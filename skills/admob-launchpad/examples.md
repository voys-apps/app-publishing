# AdMob examples

User finishes Console → pastes IDs into `.env.local` →:

```bash
cd scripts/admob
pnpm eas:push
```

Pushes all present `EXPO_PUBLIC_ADMOB_*` to EAS `development`, `preview`, `production`.
