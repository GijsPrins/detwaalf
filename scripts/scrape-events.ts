import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as cheerio from 'cheerio'
import type { ScrapedEvent, ImportDistance } from './types.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE_URL = 'https://www.runinfo.nl'
const OUTPUT_FILE = path.join(__dirname, 'scraped-events.json')

const PROVINCE_MAP: Record<string, number> = {
  GR: 1, FR: 2, DR: 3, OV: 4, FL: 5, GE: 6,
  UT: 7, NH: 8, ZH: 9, ZE: 10, NB: 11, LI: 12,
}

const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mrt: 3, apr: 4, mei: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dec: 12,
}

function mapDistance(km: number): ImportDistance | null {
  if (km >= 9.5 && km <= 10.5)  return { distance: '10k',           distanceCategory: '10k'      }
  if (km >= 14.5 && km <= 15.5) return { distance: '15k',           distanceCategory: '10k'      }
  if (km >= 15.9 && km <= 16.5) return { distance: '10_miles',      distanceCategory: '10k'      }
  if (km >= 20   && km <= 22)   return { distance: 'half_marathon',  distanceCategory: 'half'     }
  if (km >= 29   && km <= 31)   return { distance: '30k',           distanceCategory: 'half'     }
  if (km >= 41   && km <= 43)   return { distance: 'marathon',      distanceCategory: 'marathon' }
  return null
}

function inferYear(day: number, month: number): number {
  const today = new Date()
  const eventDate = new Date(today.getFullYear(), month - 1, day)
  return eventDate >= today ? today.getFullYear() : today.getFullYear() + 1
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

async function scrape(): Promise<ScrapedEvent[]> {
  console.log(`Fetching ${BASE_URL}/loopagenda.htm ...`)
  const res = await fetch(`${BASE_URL}/loopagenda.htm`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  const html = await res.text()

  const $ = cheerio.load(html)
  const events: ScrapedEvent[] = []

  $('table tr').each((_, row) => {
    const cells = $(row).find('td')
    if (cells.length < 6) return

    const dayText    = $(cells[0]).text().trim()
    const monthText  = $(cells[1]).text().trim().toLowerCase()
    const nameCell   = $(cells[2])
    const provText   = $(cells[3]).text().trim().toUpperCase()
    const location   = $(cells[4]).text().trim()
    const distText   = $(cells[5]).text().trim()

    const day = parseInt(dayText, 10)
    const month = MONTH_MAP[monthText]
    if (!day || !month) return

    const provinceId = PROVINCE_MAP[provText]
    if (!provinceId) return

    const rawNumbers = distText.match(/\d+(?:\.\d+)?/g) ?? []
    const distances: ImportDistance[] = []
    for (const numStr of rawNumbers) {
      const mapped = mapDistance(parseFloat(numStr))
      if (mapped && !distances.find(d => d.distance === mapped.distance)) {
        distances.push(mapped)
      }
    }
    if (distances.length === 0) return

    const name     = (nameCell.find('a').first().text().trim() || nameCell.text().trim()).replace(/\s+/g, ' ')
    const href     = nameCell.find('a').first().attr('href')
    const eventUrl = href ? `${BASE_URL}/${href}` : null
    const year     = inferYear(day, month)

    events.push({
      name,
      event_date:    `${year}-${pad(month)}-${pad(day)}`,
      province_id:   provinceId,
      province_abbr: provText,
      location,
      event_url:     eventUrl,
      distances,
      raw_distances: distText,
    })
  })

  return events
}

const events = await scrape()
console.log(`\nFound ${events.length} events with matching distances.`)
await fs.writeFile(OUTPUT_FILE, JSON.stringify(events, null, 2), 'utf-8')
console.log(`Saved to scripts/scraped-events.json\n`)
console.log('Run "pnpm review-events" to review and import.')
