# Environments

This project uses separate environments so development and testing do not touch
production data by accident.

## Environment Roles

| Environment | Purpose | Database |
| --- | --- | --- |
| Local | Daily development and local tests | Local Supabase or staging when local Supabase is not available |
| Staging | Manual acceptance testing before production | Dedicated Supabase staging project |
| Production | Live users | Dedicated Supabase production project |

Production is never the default target for Supabase CLI commands. The local
Supabase CLI link should point at staging, so `supabase db push` cannot
accidentally apply migrations to production.

## Supabase CLI Target

After creating the staging Supabase project, link the local CLI to staging:

```bash
supabase login
supabase link --project-ref <staging-project-ref>
```

Verify the linked project before running remote database commands:

```bash
cat supabase/.temp/project-ref
supabase db push --dry-run
```

On Windows PowerShell:

```powershell
Get-Content supabase\.temp\project-ref
supabase db push --dry-run
```

If the project ref is not the staging project, stop and relink before running
`supabase db push`.

## Applying Migrations

Staging is the default remote migration target:

```bash
supabase db push
```

Before the first staging migration push, the staging database must be baselined
from the current production schema. The existing historical migrations assume
some tables already exist and are not a complete bootstrap from an empty
Supabase project.

After baselining, seed only non-user reference data such as provinces, medal
thresholds, app roles, and slug words. Do not copy production users, profiles,
events, participations, contact messages, auth data, or storage data to staging
by default.

Production migrations must be applied deliberately. Do not keep the local CLI
linked to production. For production releases, use a short manual release step
and verify the target project before applying migrations.

Recommended production release order when a database change is involved:

1. Confirm the change has already been tested on staging.
2. Check Supabase production backup/status in the dashboard.
3. Apply the migration to production deliberately.
4. Deploy the production app from `master`.
5. Smoke test the changed flow on production.

## Deployment Flow

Feature branches move through the environments in this order:

```text
feature/<change>
  -> staging branch / staging deployment
  -> master / production deployment
```

Merge the feature branch into `staging` for testing. After staging is approved,
merge the same feature branch into `master`. Do not merge `staging` into
`master`, because staging can contain other work that is not ready for
production.

Delete the feature branch only after the production deployment and smoke test
are complete.

## Environment Variables

Each hosted app must have environment variables for its own Supabase project:

| Key | Local | Staging | Production |
| --- | --- | --- | --- |
| `SUPABASE_URL` | Local or staging URL | Staging project URL | Production project URL |
| `SUPABASE_KEY` | Local or staging anon/publishable key | Staging anon/publishable key | Production anon/publishable key |
| `NODE_ENV` | `development` | `production` | `production` |

Never use the Supabase service-role key in Nuxt, Clever Cloud, GitHub Actions,
or any frontend-accessible runtime.

## Staging Availability

The staging Clever Cloud app may be stopped when it is not being used. Start it
for manual testing, demos, and staging E2E runs, then stop it again to reduce
costs. The staging Supabase project remains the persistent staging backend.
