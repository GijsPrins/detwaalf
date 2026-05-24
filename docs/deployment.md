# Deployment

This public repository keeps only general deployment information.

Private operational runbooks, provider settings, domains, DNS records, account references, rollback notes, and infrastructure details live in the private `detwaalf-ops` repository.

## Public Runtime Requirements

- Node.js 22
- pnpm
- Nuxt production build via `pnpm build`
- Runtime command points at the generated Nuxt server output
- Supabase environment variables are required

## Environment Variables

Set these in the deployment environment:

| Key | Notes |
| --- | --- |
| `NODE_ENV` | Use `production` for production deployments |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` / `SUPABASE_ANON_KEY` | Supabase anon key only |

Never expose or deploy the Supabase service-role key in the frontend or public runtime.

## Commands

```bash
pnpm install
pnpm build
pnpm preview
```

## Related Private Docs

See the private `detwaalf-ops` repository for:

- `deployments.md`
- `domains.md`
- `infra.md`
