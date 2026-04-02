# De Twaalf — Database Schema
**detwaalf.run**

```mermaid
erDiagram
  profiles {
    uuid id PK
    text display_name
    text avatar_url
    boolean is_public
    timestamptz created_at
    timestamptz updated_at
  }
  app_roles {
    text role PK
    text description
  }
  profile_roles {
    uuid profile_id PK_FK
    text role PK_FK
    timestamptz granted_at
  }
  provinces {
    smallint id PK
    text name
    text slug
  }
  medal_thresholds {
    text medal PK
    numeric min_distance_km
    smallint display_order
  }
  events {
    uuid id PK
    text name
    date event_date
    text location
    smallint province_id FK
    text distance_category
    text event_url
    date registration_opens
    date registration_deadline
    uuid created_by FK
    timestamptz created_at
    timestamptz updated_at
  }
  event_participations {
    uuid id PK
    uuid event_id FK
    uuid user_id FK
    text status
    integer finish_time_seconds
    numeric actual_distance_km
    text timing_url
    text notes
    text proof_image_path
    timestamptz created_at
    timestamptz updated_at
  }

  profiles ||--o{ profile_roles : "has"
  app_roles ||--o{ profile_roles : "assigned via"
  profiles ||--o{ events : "creates"
  profiles ||--o{ event_participations : "tracks"
  provinces ||--o{ events : "hosts"
  events ||--o{ event_participations : "has"
```

---

## Notes

- `medal_thresholds` is not related to other tables via FK — it is queried by the `get_medal(distance_km)` database function at runtime
- `profile_roles` is a join table with a composite primary key `(profile_id, role)`
- `event_participations` has a unique constraint on `(event_id, user_id)` — one record per user per event
- `finish_time_seconds` is an integer (seconds) — format to `h:mm:ss` in the frontend
- `proof_image_path` is a Supabase Storage path, not a full URL — resolve to a signed URL in the frontend
- `status` enum values: `interested`, `signed_up`, `completed`, `dns`, `dnf`
- `distance_category` enum values: `10k`, `half`, `marathon`
