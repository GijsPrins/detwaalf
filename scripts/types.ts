export type EventDistance = '10k' | '15k' | '10_miles' | 'half_marathon' | '30k' | 'marathon'
export type DistanceCategory = '10k' | 'half' | 'marathon'

export interface ImportDistance {
  distance: EventDistance
  distanceCategory: DistanceCategory
}

export interface ScrapedEvent {
  name: string
  event_date: string
  province_id: number
  province_abbr: string
  location: string
  event_url: string | null
  distances: ImportDistance[]
  raw_distances: string
}
