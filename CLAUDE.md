# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` — loaded as a Vite plugin, not a Nuxt module) |
| Data fetching | TanStack Query (`@tanstack/vue-query`) |
| Global UI state | Pinia (`@pinia/nuxt`) — UI state only, not server data |
| Backend | Supabase (PostgreSQL + Auth + Storage) via `@nuxtjs/supabase` |
| i18n | `@nuxtjs/i18n` — Dutch only (`nl`) for now; English will be added in one pass later |
| Types | Generated from Supabase schema at `app/types/database.types.ts` |

In Nuxt 4, `~`/`@` resolve to `app/`. All source files live under `app/`. Exception: i18n locale files live at `i18n/locales/nl.ts` (outside `app/`).

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
  constants/        # enums & lookup tables (distances, participation, provinces)
  mappers/          # raw → view-model transforms
  pages/            # route entry points, thin wrappers
  queries/          # Supabase calls, typed
  stores/           # Pinia — UI state only (empty; not yet needed)
  types/            # TS types; database.types.ts is generated, do not edit
  utils/            # pure utility functions (e.g. distance categorisation)
i18n/
  locales/nl.ts     # Dutch translations (only locale maintained for now)
supabase/
  migrations/       # sequential SQL migrations; add new files here for schema changes
```

Currently `app/queries/` and `app/mappers/` each contain a single `events.ts` file that covers all domains. Add a new file per domain as the app grows — don't extend the single file indefinitely.

### Domain model: distances and medals

The app uses two separate enums that must not be confused:

- **`event_distance`** — the actual distance an event offers: `10k | 15k | 10_miles | half_marathon | 30k | marathon`
- **`distance_category`** — the medal bracket derived from an event distance: `10k | half | marathon`

Mapping (defined in `app/utils/eventDistances.ts`):
```
10k / 15k / 10_miles  →  10k   (bronze)
half_marathon / 30k   →  half  (silver)
marathon              →  marathon (gold)
```

Always use `event_distance` when storing or displaying a specific event's distances. Use `distance_category` only when determining medal eligibility or filtering by medal type.

### TanStack Query cache keys

Conventions used across all composables — follow them when adding new ones:

| Resource | Query key |
|---|---|
| Events list | `["events", "list"]` |
| Event detail | `["events", "detail", id]` |
| User participations | `["eventParticipations", userId]` |
| Event participation | `["eventParticipation", eventId]` |
| Provinces | `["provinces"]` |
| Profile | `["profile", userId]` |

Participation detail uses `staleTime: 0` (always refetch on mount). Provinces use `staleTime: Infinity` (static data, load once).

### Role-based access

Admin/event-manager gating is done via a Supabase RPC call `has_role(role_name)`, wrapped in `useCanManageEvents()`. Use this composable to conditionally show management UI; enforce the same check server-side in RLS or DB functions — never rely on the frontend check alone.

### No test setup

There is no test runner configured (no Vitest, no Jest). Do not add test infrastructure unless explicitly asked.

---

## Design system

The visual language is minimal, airy, and text-forward. No emoji in UI copy. No decorative icons unless they carry meaning.

### Colours

| Role | Token |
|---|---|
| Page background | `bg-gray-50` |
| Card background | `bg-white` |
| Card border | `border border-gray-100` |
| Primary text | `text-gray-900` |
| Secondary text | `text-gray-700` |
| Muted text | `text-gray-500` |
| Subtle / meta text | `text-gray-400` |
| Divider | `divide-gray-50` / `border-gray-100` |
| Primary action (button, link) | `bg-orange-600 hover:bg-orange-700 text-white` |
| Active / selected pill | `bg-orange-100 text-orange-700` |
| Status / accent text | `text-orange-600` |
| Bronze track | `#cd7f32` + `bg-orange-100 text-orange-700` |
| Silver track | `#9ca3af` + `bg-gray-100 text-gray-500` |
| Gold track | `#eab308` + `bg-yellow-100 text-yellow-700` |

### Typography

| Use | Classes |
|---|---|
| Hero heading | `text-4xl font-bold text-gray-900 tracking-tight` |
| Large stat | `text-2xl font-bold text-gray-900` |
| Card / section title | `text-sm font-semibold text-gray-900` |
| Label / body | `text-sm text-gray-700` |
| Supporting body | `text-sm text-gray-500 leading-relaxed` |
| Meta / secondary detail | `text-xs text-gray-400` |

### Cards

All content blocks use the same card shell — no shadows, border only:

```
bg-white rounded-xl border border-gray-100 p-5
```

Use `p-6` when the card contains a map or large visual. Never mix shadow with border on the same card.

### Interactive controls

**Pill filter button** (inactive / active):
```
px-3 py-1 rounded-full text-xs font-medium transition-colors
inactive: text-gray-500 hover:text-gray-900
active:   bg-orange-100 text-orange-700
```

**Primary CTA button:**
```
inline-flex items-center rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors
```

**Badge / status pill:**
```
text-xs font-medium px-2 py-0.5 rounded-full  +  colour variant
```

### Progress bars

```
h-1.5 bg-gray-100 rounded-full overflow-hidden
  → inner div: h-full rounded-full transition-all  (background set via :style)
```

### Spacing rhythm

- Gap between cards / grid columns: `gap-4` or `gap-5`
- Padding inside cards: `p-5` (default), `p-6` (large visual)
- Section vertical padding on landing: `py-32` / `pb-24`
- Content max-width: `max-w-3xl` (feature grid), `max-w-sm` (hero copy)
- Stacked list items: `divide-y divide-gray-50` with `py-3 first:pt-0 last:pb-0`

### Participation status badges

Used in the events list and anywhere a participation status is displayed:

| Status | Classes |
|---|---|
| `interested` | `bg-orange-100 text-orange-700` |
| `signed_up` | `bg-blue-100 text-blue-700` |
| `completed` | `bg-green-100 text-green-700` |
| `dns` / `dnf` | `bg-gray-100 text-gray-500` |

### Tone

- No emoji in templates or i18n strings
- Keep UI copy short and direct — labels, not sentences
- Dates and meta details are `text-xs text-gray-400`, never emphasised

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
- Only maintain Dutch (`nl`) translations. Do not add or update English strings — the English locale will be added in one pass once the app is feature-complete
- Never use `any`; use `unknown` and narrow it. The generated DB types cover most cases — there is rarely a reason to escape the type system
- Always destructure and check `{ data, error }` from every Supabase call in the query layer; never assume success
- No arbitrary Tailwind values (e.g. `w-[337px]`); if a custom value is needed more than once, add it to the Tailwind theme
