# De Twaalf

Track your progress toward completing a running event in each of the 12 Dutch provinces.

Inspired by the ProRun 12 Provincies challenge — De Twaalf goes further by covering the full event lifecycle: from discovery through signing up to finishing, with medal tiers derived from your actual distance run.

**detwaalf.run** — currently invite-only.

---

## Medal tiers

| Medal | Minimum distance |
|---|---|
| Bronze | 10 km |
| Silver | 21.098 km (half marathon) |
| Gold | 42.195 km (marathon) |

Thresholds are database-driven — new tiers can be added without a code change.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Nuxt 4 |
| Styling | Tailwind CSS |
| Data fetching | TanStack Query |
| Global UI state | Pinia |
| Backend | Supabase (PostgreSQL, Auth, Storage) — EU Frankfurt |
| Hosting | Clever Cloud (France) |
| i18n | Dutch (primary), English |

---

## Development

```bash
pnpm install
pnpm dev
```

Requires a `.env` file:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

After changing the database schema, regenerate types:

```bash
npx supabase gen types typescript --linked > app/types/database.types.ts
```
