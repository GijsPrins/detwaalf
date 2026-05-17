# Project Map

Twaalf Provincies is a Nuxt 4 application for tracking running-event progress across the 12 Dutch provinces. The frontend is organized around Nuxt pages, feature components, TanStack Query composables, and typed Supabase query modules.

## Runtime Shape

```text
Nuxt route/page
  -> feature components
  -> composables using TanStack Query
  -> query functions
  -> Supabase client
  -> Postgres tables, RPCs, and RLS policies
```

Supabase is the backend boundary. Client-side checks decide what to show, but security-sensitive rules must be enforced with Supabase RLS policies or database functions.

## Root Files

| Path | Purpose |
| --- | --- |
| `nuxt.config.ts` | Nuxt, Supabase, i18n, Tailwind/Vite, route headers, and auth redirect configuration. |
| `package.json` | Scripts and dependency list. Use `pnpm dev`, `pnpm build`, `pnpm test`, and `pnpm test:e2e`. |
| `pnpm-workspace.yaml` | pnpm build approval metadata. |
| `vitest.config.ts` | Unit test config, `~`/`@` aliases to `app/`, coverage paths. |
| `playwright.config.ts` | E2E config, base URL, auth setup project. |
| `README.md` | Product summary and high-level stack notes. |
| `CLAUDE.md` | Agent/coding guidelines and detailed project conventions. |

## Git And Review Workflow

- `master` is protected. Do not push work directly to `master`.
- Create a branch for each feature or fix before changing code.
- Open a GitHub PR for review when the branch is ready.
- The user approves and merges PRs by hand in GitHub.
- Unit tests and E2E tests are required to pass before merge.
- When adding or editing behavior, update or add unit tests and E2E coverage for the changed flow. Keep test scope proportional, but do not leave new behavior uncovered.
- Local pre-push sanity check:

```bash
pnpm test
pnpm build
pnpm test:e2e
```

On Windows PowerShell, use `pnpm.cmd` if the `pnpm.ps1` shim is blocked by execution policy.

## Source Layout

In Nuxt 4, `~` and `@` resolve to `app/`.

```text
app/
  app.vue              # Root shell: route announcer, layout, page
  assets/css/          # Global CSS and Tailwind import
  components/          # Vue components grouped by feature
  composables/         # useX hooks for data and behavior
  constants/           # Static lookup tables and class maps
  layouts/             # default, landing, and auth shells
  mappers/             # Raw Supabase rows -> view models
  middleware/          # Global route middleware
  pages/               # File-based routes
  plugins/             # Nuxt plugins, currently Vue Query
  queries/             # Typed Supabase calls
  types/               # Shared TS types and generated database types
  utils/               # Pure utility functions

i18n/locales/
  nl.ts                # Dutch translations

supabase/
  migrations/          # SQL migrations
  templates/           # Supabase email templates

test/
  unit/                # Vitest tests mirroring app structure
  e2e/                 # Playwright tests and auth fixtures

docs/
  brief.md             # Product brief
  schema.md            # Database schema notes
  deployment.md        # Deployment notes
  ideas.md             # Product ideas
```

## Main Feature Areas

| Area | Routes/components | Notes |
| --- | --- | --- |
| Landing and static pages | `pages/index.vue`, `onboarding.vue`, `privacy.vue` | Public pages, usually use the `landing` layout. |
| Auth | `login.vue`, `register.vue`, `confirm.vue`, `verify-email.vue` | Uses Supabase auth. `auth.vue` is the centered form layout. |
| Dashboard | `pages/dashboard.vue`, `components/dashboard/*`, `components/province/*` | Shows province map, medal progress, upcoming runs, and completion prompts. |
| Events | `pages/events/*`, `components/event/*` | Event catalog, detail view, event creation/editing, and participation status controls. |
| Participation | `components/participation/*`, `useSetParticipation`, `useCompleteParticipation` | Tracks interested/signed up/completed/DNS/DNF and finish metadata. |
| Profiles | `pages/profile/index.vue`, `pages/profile/[slug].vue` | Private profile settings plus public progress profile by slug. |
| Admin | `pages/admin/messages.vue`, `pages/admin/slugs.vue` | Role-gated admin UI for contact messages and slug word management. |

## Data Layer Conventions

Keep data access split into three layers:

1. `app/queries/`
   - Contains typed Supabase calls.
   - Always destructure and check `{ data, error }`.
   - Return database-shaped rows or small typed row projections.
   - Do not put UI formatting here.

2. `app/composables/`
   - Wrap queries in TanStack Query `useQuery` and `useMutation`.
   - Own query keys, cache invalidation, optimistic updates, loading state, and mutation side effects such as navigation.
   - Pages and components should prefer composables over direct Supabase calls.

3. `app/mappers/`
   - Convert raw rows into view models.
   - Keep these functions pure and unit-testable.
   - Use mappers when a page needs cleaner names or merged data from multiple queries.

Current examples:

| Domain | Query module | Common composables |
| --- | --- | --- |
| Events and participations | `queries/events.ts` | `useEventList`, `useEvent`, `useAddEvent`, `useUpdateEvent`, `useSetParticipation`, `useCompleteParticipation` |
| Profiles | `queries/profiles.ts` | `useProfile`, `usePublicProfile` |
| Contact messages | `queries/contactMessages.ts` | `useContactMessages`, `useUnreadContactMessagesCount`, `useMarkMessageRead` |
| Slug words | `queries/slugWords.ts` | `useSlugWords` |

## Query Key Conventions

Use stable array keys and invalidate by prefix where practical.

| Resource | Query key pattern |
| --- | --- |
| Events list | `["events", "list"]` |
| Event detail | `["events", "detail", id]` |
| User participations | `["eventParticipations", userId]` |
| Event participation | `["eventParticipation", eventId]` |
| Provinces | `["provinces"]` |
| Current profile | `["profile", "self"]` |
| Public profile | `["publicProfile", slug]` |
| Contact messages | `["contactMessages"]` |
| Slug words | `["slugWords"]` |

## Auth And Roles

- Supabase auth is configured in `nuxt.config.ts`.
- The Supabase module redirects protected routes to `/login`.
- `app/middleware/email-verified.global.ts` redirects signed-in users without a confirmed email to `/verify-email`.
- Public route exceptions are listed both in Nuxt Supabase redirect config and in the email verification middleware.
- Admin/event-manager UI checks use `useCanManageEvents()`, which calls the `has_role` Supabase RPC.
- Frontend role checks are for UX only; enforce authorization in RLS policies or DB functions.

When a composable needs the current authenticated user for a write, call `supabase.auth.getUser()` inside the `queryFn` or `mutationFn`. Use `useSupabaseUser()` for reactive UI and cache keys.

## Domain Conventions

Events have one or more offered distances. Keep these concepts separate:

| Concept | Meaning | Examples |
| --- | --- | --- |
| `event_distance` | The actual distance offered by an event. | `10k`, `15k`, `10_miles`, `half_marathon`, `30k`, `marathon` |
| `distance_category` | The medal/progress track that distance counts toward. | `10k`, `half`, `marathon` |

Distance mapping and validation helpers live in `app/utils/eventDistances.ts`. Display order and badge styles live in `app/constants/distances.ts`.

Participation status values are:

```text
interested, signed_up, completed, dns, dnf
```

Shared status styling lives in `app/constants/participation.ts`.

## UI Conventions

- User-facing strings should go through `useI18n()` and `i18n/locales/nl.ts`.
- Dutch is the maintained locale for now.
- Tailwind utility classes are used directly in Vue templates.
- Shared page-width helpers live in `app/assets/css/main.css`:
  - `.page-list-container`
  - `.page-data-container`
- Generic layout chrome belongs in `app/layouts/`.
- Domain UI belongs in feature folders under `app/components/`.
- Prefer computed properties over complex template expressions.
- Components should receive props and emit events; data fetching normally belongs in composables or pages.

## Testing Conventions

Unit tests:

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

- Tests live in `test/unit/`.
- Mirror the source folder when adding tests.
- Prioritize pure utilities, mappers, constants, query helpers, and composable behavior.
- Add or update unit tests alongside changes to utilities, mappers, query functions, cache behavior, validation, and composables.

E2E tests:

```bash
pnpm test:e2e
pnpm test:e2e:ui
```

- Tests live in `test/e2e/`.
- Playwright expects the app at `PLAYWRIGHT_BASE_URL` or `http://localhost:3000`.
- Auth setup lives in `test/e2e/setup/auth.setup.ts`.
- Add or update E2E tests for user-visible flows, especially auth, event creation/editing, participation status changes, completion, profile visibility, admin actions, and contact messages.

## Where To Put New Code

| Need | Put it here |
| --- | --- |
| New route | `app/pages/...` |
| Reusable feature UI | `app/components/<feature>/...` |
| Raw Supabase read/write | `app/queries/<domain>.ts` |
| Vue Query wrapper | `app/composables/use<Thing>.ts` |
| Raw row to view model transform | `app/mappers/<domain>.ts` |
| Shared enum/class map | `app/constants/<domain>.ts` |
| Pure helper | `app/utils/<domain>.ts` |
| Shared TS type | `app/types/<domain>.ts` |
| Database schema/policy change | `supabase/migrations/<timestamp>_<name>.sql` |
| Translation | `i18n/locales/nl.ts` |
| Unit test | `test/unit/<matching-source-path>.test.ts` |
| E2E test | `test/e2e/<flow>.spec.ts` |

## Maintenance Notes

- Do not edit `app/types/database.types.ts` manually; regenerate it from Supabase.
- Do not expose service-role keys in frontend code.
- Keep Supabase queries typed with the generated `Database` type.
- Add migrations for schema or policy changes rather than relying on dashboard-only changes.
- Keep pages readable. When a page accumulates reusable domain logic, extract it into a composable, mapper, or utility.
