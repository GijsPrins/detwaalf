import type { Tables, Enums } from '~/types/database.types'
import type { EventRow, ParticipationRow } from '~/queries/events'

export interface EventViewModel {
  id: string
  name: string
  provinceName: string
  provinceId: number
  distanceCategory: Enums<'distance_category'>
  eventDate: string
  location: string | null
  eventUrl: string | null
  registrationOpens: string | null
  registrationDeadline: string | null
  createdBy: string
  participationId: string | null
  participationStatus: Enums<'participation_status'> | null
}

export function mapEvent(event: EventRow, participation: ParticipationRow | undefined): EventViewModel {
  return {
    id: event.id,
    name: event.name,
    provinceName: event.province?.name ?? '',
    provinceId: event.province_id,
    distanceCategory: event.distance_category,
    eventDate: event.event_date,
    location: event.location,
    eventUrl: event.event_url,
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
