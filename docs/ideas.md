# De Twaalf — Ideas & Backlog
**detwaalf.run**

Priority labels: **Must** = required before public release, **Should** = high value, **Could** = nice to have.

---

## Pre-release requirements

These must be completed before the app is opened to the public.

| Feature | Description | Priority |
|---|---|---|
| Security review | Audit RLS policies, auth flows, exposed secrets, input validation, XSS/injection risks | **Must** |
| GDPR compliance | Privacy policy, right to erasure (account + all data), cookie notice if needed | **Must** |
| Email verification | Require email verification before a user can log any data | **Must** |
| Onboarding page | Explain the challenge rules, distances, medal tiers, how the app works | **Must** |
| Error monitoring | Set up Sentry or similar for frontend errors; review Supabase rate limits | **Should** |
| Unit + E2E tests | Vitest for logic/composables, Playwright for critical flows (login, add event, map view) | **Should** |

---

## User features

| Feature | Description | Priority |
|---|---|---|
| Public registration | Open sign-up flow once product is mature enough for public users | **Should** |
| Profile page | Display name, optional avatar, short bio; user can edit own profile | **Should** |
| Progress sharing | Share progress to social media, e.g. "Ik sta op 7/12 voor zilver!" | **Could** |
| Milestone notifications | Notify on milestones: first province, halfway, track completed. Channel TBD (in-app / email) | **Could** |
| Extra completion info | Log extra context when completing, e.g. running with someone else's bib. Text field + optional proof image | **Could** |

---

## Community features

All require multi-user to be stable and tested first.

| Feature | Description | Priority |
|---|---|---|
| Community map | Per province show % of public profiles with bronze/silver/gold. No names, counts only — privacy-friendly | **Should** |
| Private profiles + share link | Users can set profile to private. Private profiles get a secret UUID share link for sharing manually | **Should** |
| Leaderboard | Overview of who is furthest per track (bronze/silver/gold). Format TBD | **Could** |
| Admin user management | Admin can view, manage and block users | **Should** |

---

## Event discovery

| Feature | Description | Priority |
|---|---|---|
| Upcoming events view | Calendar or list view of upcoming events the user has not yet participated in | **Should** |
| Per-province suggestions | Show upcoming events per province as suggestions (external links) | **Could** |

---

## Integrations

| Feature | Description | Priority |
|---|---|---|
| Strava integration | OAuth token exchange via Supabase Edge Functions + webhook to receive activities as participation suggestions. User confirms match in app. | **Could** |

---

## Future / big bets

These require significant architectural decisions and are not planned for the near term.

| Feature | Description | Priority |
|---|---|---|
| Multi-country support | Add countries beyond the Netherlands. Requires flexible data model: countries table, regions instead of hardcoded provinces. Note: current SVG map library has limited country support — map infrastructure change likely needed (GeoJSON + D3 or Leaflet) | **Could** |
| New medal tiers | Add platinum (50 km+) or other tiers. Already supported: add a row to `medal_thresholds`, no code change needed | **Could** |

---

## Completed

| Feature | Notes |
|---|---|
| i18n (NL/EN) | Implemented via `@nuxtjs/i18n`. Auto-detect browser language, persistent via localStorage |
