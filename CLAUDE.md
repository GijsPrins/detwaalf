# De Twaalf — Claude Guidelines

## Security

Security is a first-class concern on every feature, not an afterthought.

- Always consider the security implications before building anything: auth, RLS policies, input validation, XSS, injection
- If a requested feature is ambiguous and could be implemented in a secure or insecure way, **ask before building**
- Never expose the Supabase service role key on the frontend — anon key only
- Never trust client-supplied data for anything security-sensitive; enforce rules in RLS policies and DB functions
- When in doubt: confirm with the user first, then build

---

## Reference docs

Always consult the Nuxt 4 docs first when looking anything up: https://nuxt.com/docs/4.x/getting-started/introduction

---

## Commands

```bash
pnpm dev          # start dev server
pnpm build        # production build
pnpm preview      # preview production build
npx supabase gen types typescript --linked > app/types/database.types.ts  # regenerate DB types
```

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Nuxt 4 |
| Styling | Tailwind CSS (`@nuxtjs/tailwindcss`) |
| Data fetching | TanStack Query (`@tanstack/vue-query`) |
| Global UI state | Pinia (`@pinia/nuxt`) — UI state only, not server data |
| Backend | Supabase (PostgreSQL + Auth + Storage) via `@nuxtjs/supabase` |
| i18n | `@nuxtjs/i18n` — Dutch primary (`nl`), English (`en`) |
| Types | Generated from Supabase schema at `app/types/database.types.ts` |

In Nuxt 4, `~`/`@` resolve to `app/`. All source files live under `app/`.

---

## Architecture

### Layer separation

Keep these four concerns strictly separate:

**Queries** (`app/queries/`)
- One file per domain (e.g. `events.ts`, `participations.ts`)
- Each file exports typed functions that call Supabase and return raw data
- No mapping, no business logic — just the database call
- Example: `fetchEventsByProvince(provinceId: number)`

**Mappers** (`app/mappers/`)
- One file per domain, mirroring the queries folder
- Pure functions that transform raw Supabase rows into view-friendly shapes
- No side effects, fully unit-testable
- Example: `mapParticipation(row) → { ...row, medal: deriveMedal(row.actual_distance_km) }`

**Composables** (`app/composables/`)
- Wire queries + mappers together using TanStack Query
- Own the loading/error state that components consume
- Named `use<Domain><Action>` — e.g. `useProvinceProgress`, `useEventList`
- Components should almost never call Supabase directly — always through a composable

**Views & components** (`app/pages/`, `app/components/`)
- Pages are thin: they pick a layout, call composables, pass data down
- Components receive props, emit events — no direct data fetching
- Split components early and often; prefer many small focused components over large ones

### File structure

```
app/
  components/       # reusable UI components
    ui/             # generic atoms (Button, Badge, Avatar…)
    province/       # domain-specific components
    event/
    participation/
  composables/      # useX hooks — data + behaviour
  mappers/          # raw → view-model transforms
  pages/            # route entry points, thin wrappers
  queries/          # Supabase calls, typed
  stores/           # Pinia — UI state only
  types/            # TS types; database.types.ts is generated, do not edit
```

---

## Code style

- Write code for the next person who has to read it, not for the compiler
- Prefer explicit over clever — a clear name beats a smart one-liner
- Small functions with one responsibility; if a function needs a comment to explain what it does, rename or split it
- Composables and mappers are pure where possible — side-effect-free code is easier to test and reason about
- Co-locate types with their domain; only promote to `types/` if shared across multiple domains
- Never put business logic in a component; never put rendering in a composable
- Keep logic out of templates — if a `v-if` checks more than one condition, extract it to a `computed`; the same applies to any non-trivial expression in a template binding
- No hardcoded user-facing strings in components — every string goes through `useI18n()` / `$t()`
- Never use `any`; use `unknown` and narrow it. The generated DB types cover most cases — there is rarely a reason to escape the type system
- Always destructure and check `{ data, error }` from every Supabase call in the query layer; never assume success
- No arbitrary Tailwind values (e.g. `w-[337px]`); if a custom value is needed more than once, add it to the Tailwind theme
