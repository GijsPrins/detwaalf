import type { Tables, Enums } from '~/types/database.types'
import type { EventRow, EventDistanceRow, ParticipationRow } from '~/queries/events'

export interface EventDistanceViewModel {
  id: string
  distanceCategory: Enums<'distance_category'>
  sortOrder: number
}

export interface EventViewModel {
  id: string
  name: string
  provinceName: string
  provinceId: number
  distances: EventDistanceViewModel[]
  eventDate: string
  location: string | null
  eventUrl: string | null
  registrationUrl: string | null
  registrationOpens: string | null
  registrationDeadline: string | null
  createdBy: string
  participationId: string | null
  participationStatus: Enums<'participation_status'> | null
}

function mapEventDistance(row: EventDistanceRow): EventDistanceViewModel {
  return {
    id: row.id,
    distanceCategory: row.distance_category,
    sortOrder: row.sort_order,
  }
}

export function mapEvent(event: EventRow, participation: ParticipationRow | undefined): EventViewModel {
  return {
    id: event.id,
    name: event.name,
    provinceName: event.province?.name ?? '',
    provinceId: event.province_id,
    distances: [...event.event_distances]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapEventDistance),
    eventDate: event.event_date,
    location: event.location,
    eventUrl: event.event_url,
    registrationUrl: event.registration_url,
    registrationOpens: event.registration_opens,
    registrationDeadline: event.registration_deadline,
    createdBy: event.created_by,
    participationId: participation?.id ?? null,
    participationStatus: participation?.status ?? null,
  }
}

export function mapEvents(events: EventRow[], participations: ParticipationRow[]): EventViewModel[] {
  const byEventId = new Map(participations.map(p => [p.event_id, p]))
  return events.map(event => mapEvent(event, byEventId.get(event.id)))
}

export function formatEventDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
