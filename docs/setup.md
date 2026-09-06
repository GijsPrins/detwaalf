# Setup

## Requirements
- Node.js 22
- pnpm
- VS Code

## Install

```bash
pnpm install
```

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

Resource restrictions are initially delivered as `Content-Security-Policy-Report-Only`.
They do not block resources yet. Inspect browser console violations on staging
while testing login, password recovery, event creation/location lookup, participation
results and profile pages. Reports are not collected by a server endpoint.
Nuxt inline bootstrap scripts may be reported: add nonce/hash support before enforcing
`script-src`; do not silence those warnings with `unsafe-inline` for scripts.
The initial policy allows Supabase project domains, Google Fonts and Nominatim.
Before enforcement, narrow Supabase origins to the configured environment and verify
any additional image sources. Development HMR can produce report-only warnings.

- Uses Supabase
- Uses pnpm instead of npm
