# Twaalf Provincies — Project Brief
**twaalfprovincies.run**

---

## What is it?

Twaalf Provincies is a web application that lets runners track their progress toward completing a running event in each of the 12 Dutch provinces. It is inspired by the ProRun 12 Provincies challenge but goes significantly further: where ProRun only records completed runs, Twaalf Provincies covers the full event lifecycle from discovery through to finishing.

Users can mark events as interested, signed up, or completed, and log detailed finish data when done. The app derives a medal tier from the actual distance run, not just the event category.

### Medal tiers (per province)

| Medal | Minimum distance |
|---|---|
| 🥉 Bronze | 10 km |
| 🥈 Silver | 21.098 km (half marathon) |
| 🥇 Gold | 42.195 km (marathon) |

Medal thresholds live in the database, so new tiers (e.g. platinum for 50 km) can be added without a code change.

---

## Who is it for?

Initially the app will be used by a small, invitation-only group of runners. There is no public registration yet — users are added manually via the Supabase dashboard. The architecture is fully multi-user from day one so opening registration later requires no structural changes.

---

## MVP scope

### Events (admin-managed)
- Admin and event managers add and edit running events
- Each event belongs to a province and has a distance category (10k / half / marathon)
- Events have a date, location, optional URL, and optional registration window

### Participations (user-managed)
- Users relate to events with a status: interested, signed up, completed, DNS, DNF
- On completion: log finish time (stored as integer seconds), actual distance, notes, proof image
- Medal is derived from `actual_distance_km`, not from the event's distance category
- One participation record per user per event

### Progress overview
- Per-user view showing medal status across all 12 provinces
- Interactive province map
- i18n: Dutch and English via `@nuxtjs/i18n`

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Nuxt 4 + Tailwind CSS (`@nuxtjs/tailwindcss`) |
| Data layer | TanStack Query (`@tanstack/vue-query`) + Pinia (UI state only) |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Hosting | EU-based Node.js hosting |
| Domain | twaalfprovincies.run |
| Language | Dutch (primary), English (i18n via `@nuxtjs/i18n`) |

---

## Security principles

- RLS enabled on every table — no table is accessible without an explicit policy
- `has_role()` helper function drives all access control (roles: admin, event_manager)
- Every authenticated user can add events; owners can maintain their own events and admins/event managers can maintain all events
- Proof images stored as Supabase Storage paths, not full URLs
- Supabase Auth configuration requires email verification before issuing the session used to log data; app middleware provides the corresponding UX redirect
- No secrets on the frontend — Supabase anon key only, service role key never exposed
- GDPR: keep production data in EU-based infrastructure

---

## Database schema (tables)

| Table | Purpose |
|---|---|
| `provinces` | Static reference, 12 rows, seeded at init |
| `medal_thresholds` | Medal tiers with minimum km, database-driven |
| `app_roles` | Lookup table (admin, event_manager) |
| `profiles` | Extends auth.users — display name, avatar, is_public flag |
| `profile_roles` | Join table — a user can hold multiple roles |
| `events` | Shared event catalog, created_by references profiles |
| `event_participations` | One row per user per event, drives all progress logic |

---

## Roles

| Role | Access |
|---|---|
| `admin` | Full access: users, roles, events, all participations |
| `event_manager` | Can maintain all events, cannot manage users or roles |

Role assignment is admin-only. Adding new roles in future = one INSERT into `app_roles`, no migration needed.
