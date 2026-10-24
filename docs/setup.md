# Setup

## Requirements
- Node.js 22.22.3+ (22.x) or 24.15.0+ (24.x); Nuxt also supports Node.js 26+
- pnpm 10.15.1, pinned in `package.json` and used by CI
- VS Code

## Install

```bash
pnpm install
```

Use `pnpm install --frozen-lockfile` to reproduce the reviewed dependency tree.
The build-script allowlist in `pnpm-workspace.yaml` permits only Parcel's watcher,
esbuild and vue-demi to run dependency build scripts.

### Dependency updates (16 October 2026)

All app and test dependencies present on `staging` have been updated to their
latest stable releases, including Nuxt 4.6, Pinia 4 and its Nuxt module 1,
Vitest 5 with matching coverage provider, dotenv 18 and happy-dom 21.
The Supabase Nuxt module and directly imported Supabase JS client are pinned to
2.1.0 and 2.118.0 respectively. PGlite is pinned to 0.5.10 so the database tests
from the separate security hardening PR will also use the updated dependency.
That PR's migrations and tests remain separate from this dependency update.

PRs targeting `staging` or `master` run unit tests and production-build E2E tests.
Before promotion, test login/session restoration, participation changes, event
management and contact messages on staging, including browser CSP behavior.

The dependency audit still reports two high-severity advisories without published
patches: [node-forge signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
and [braces stack exhaustion](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
They enter through Nuxt/Nitro development-server and build tooling. This does not
establish production exploitability. Keep devtools disabled in production and
development servers private; recheck the audit when upstream fixes are released.

## Development

```bash
pnpm dev
```

## Environment variables

Place the .env file in the repository root.

Use the Supabase variables for the environment you are running against:

```bash
SUPABASE_URL=
SUPABASE_KEY=
NUXT_PUBLIC_SITE_URL=http://localhost:3000
```

For local development, prefer local Supabase when available. If local Supabase
is not set up, use the staging Supabase project rather than production.

Never put the Supabase service-role key in `.env`; the Nuxt app only needs the
anon/publishable key.

Contact form notifications are sent server-side through Brevo. Set these only
in local `.env` or deployment environment variables, never in source code:

```bash
BREVO_API_KEY=
CONTACT_NOTIFICATION_FROM=notificaties@mail.twaalfprovincies.run
CONTACT_NOTIFICATION_TO=info@twaalfprovincies.run
```

`NUXT_PUBLIC_SITE_URL` must be the canonical URL for the environment. It is
used for Supabase auth redirects and links in contact notification emails.

## Supabase CLI

The local Supabase CLI should be linked to the staging project, not production.
This makes `supabase db push` safe by default.

```bash
supabase login
supabase link --project-ref <staging-project-ref>
supabase db push --dry-run
```

See `docs/environments.md` for the full environment and deployment flow.

## Notes
### Browser security headers

`nuxt.config.ts` sets host-only HSTS for one year and disables unused camera,
microphone, geolocation, payment and USB browser APIs. File uploads are unaffected.
The enforced CSP restricts base URLs and form submissions to this origin and
disallows plugins and embedding the app in frames.

Built SSR pages enforce the full CSP through `app/plugins/csp.server.ts`.
Each response gets a cryptographically random 256-bit nonce, attached only to scripts
registered through Nuxt's head renderer, including its inline configuration script.
`script-src` uses that nonce and `strict-dynamic`; arbitrary inline scripts, inline
event handlers and parser-inserted scripts without a nonce are blocked, even from
the same origin. Do not add nonces by scanning raw HTML or allow `unsafe-inline`
for scripts. Inline styles remain allowed for Vue style bindings.

SSR HTML is `private, no-store` so caches cannot reuse response nonces. Do not enable
HTML prerendering, route caching or CDN HTML caching without redesigning the CSP;
static assets retain their normal caching behavior. The base route-rule policy
remains for non-SSR responses. Vite development uses only that base policy.

Connections/images allow only the configured Supabase origin, with Google Fonts
and Nominatim allowed for their respective resources. Report-Only has been removed;
violations now block resources and appear in the browser console. No reporting
endpoint collects them. Test the production build, not the Vite dev server, with
`test/e2e/csp.spec.ts`, and verify authenticated flows on staging before promotion.
Install both test browsers with `pnpm exec playwright install chromium firefox`.
The `firefox-security` project runs the CSP and password-reset access tests;
Chromium runs the full suite. No new environment variable or migration is needed.

- Uses Supabase
- Uses pnpm instead of npm
