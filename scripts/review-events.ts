import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as readline from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import type { ScrapedEvent, ImportDistance } from './types.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCRAPED_FILE = path.join(__dirname, 'scraped-events.json')

// ─── ANSI helpers ────────────────────────────────────────────────────────────
const bold   = (s: string) => `\x1b[1m${s}\x1b[0m`
const dim    = (s: string) => `\x1b[2m${s}\x1b[0m`
const green  = (s: string) => `\x1b[32m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const cyan   = (s: string) => `\x1b[36m${s}\x1b[0m`
const red    = (s: string) => `\x1b[31m${s}\x1b[0m`

const PROVINCE_NAMES: Record<number, string> = {
  1: 'Groningen', 2: 'Friesland', 3: 'Drenthe', 4: 'Overijssel',
  5: 'Flevoland', 6: 'Gelderland', 7: 'Utrecht', 8: 'Noord-Holland',
  9: 'Zuid-Holland', 10: 'Zeeland', 11: 'Noord-Brabant', 12: 'Limburg',
}

const DISTANCE_LABEL: Record<string, string> = {
  '10k':           '10 km',
  '15k':           '15 km',
  '10_miles':      '10 mijl (~16 km)',
  'half_marathon': 'halve marathon (~21 km)',
  '30k':           '30 km',
  'marathon':      'marathon (~42 km)',
}

const VALID_DISTANCES = ['10k', '15k', '10_miles', 'half_marathon', '30k', 'marathon'] as const
const CATEGORY_MAP: Record<string, ImportDistance['distanceCategory']> = {
  '10k': '10k', '15k': '10k', '10_miles': '10k',
  'half_marathon': 'half', '30k': 'half', 'marathon': 'marathon',
}

// ─── Env validation ──────────────────────────────────────────────────────────
function requireEnv(name: string): string {
  const val = process.env[name]
  if (!val) {
    console.error(red(`Ontbrekende env var: ${name}`))
    console.error(dim('Voeg deze toe aan je .env bestand en probeer opnieuw.'))
    process.exit(1)
  }
  return val
}

const supabase = createClient(
  requireEnv('SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false } },
)
const ADMIN_USER_ID = requireEnv('SUPABASE_ADMIN_USER_ID')

// ─── Supabase helpers ────────────────────────────────────────────────────────
async function fetchExistingKeys(): Promise<Set<string>> {
  const { data, error } = await supabase.from('events').select('name, event_date')
  if (error) throw error
  return new Set((data ?? []).map(e => `${e.name}|${e.event_date}`))
}

async function importEvent(event: ScrapedEvent): Promise<void> {
  const { data: row, error: eventError } = await supabase
    .from('events')
    .insert({
      name:                  event.name,
      event_date:            event.event_date,
      province_id:           event.province_id,
      location:              event.location || null,
      event_url:             event.event_url || null,
      registration_url:      null,
      registration_opens:    null,
      registration_deadline: null,
      created_by:            ADMIN_USER_ID,
    })
    .select('id')
    .single()

  if (eventError) throw eventError

  const distanceRows = event.distances.map((d, i) => ({
    event_id:          row.id,
    distance:          d.distance,
    distance_category: d.distanceCategory,
    sort_order:        i,
  }))

  const { error: distError } = await supabase.from('event_distances').insert(distanceRows)
  if (distError) throw distError
}

// ─── Review UI ───────────────────────────────────────────────────────────────
function printEvent(event: ScrapedEvent, index: number, total: number): void {
  const line = '─'.repeat(54)
  console.log(`\n${dim(line)}`)
  console.log(`${dim(`Event ${index + 1} / ${total}`)}`)
  console.log(line)
  console.log(`${bold('Naam:')}       ${event.name}`)
  console.log(`${bold('Datum:')}      ${event.event_date}`)
  console.log(`${bold('Provincie:')}  ${PROVINCE_NAMES[event.province_id]}${dim(` (${event.province_abbr})`)}`)
  console.log(`${bold('Locatie:')}    ${event.location || dim('(onbekend)')}`)
  console.log(`${bold('Afstanden:')}  ${event.distances.map(d => cyan(DISTANCE_LABEL[d.distance])).join(', ')}`)
  console.log(`             ${dim(`(gescrapet: "${event.raw_distances}")`)}`)
  if (event.event_url) console.log(`${bold('URL:')}        ${dim(event.event_url)}`)
  console.log(line)
}

async function editEvent(event: ScrapedEvent, rl: readline.Interface): Promise<ScrapedEvent> {
  const e = { ...event }
  console.log('\n  1  Naam')
  console.log('  2  Datum (YYYY-MM-DD)')
  console.log('  3  Provincie-ID (1-12)')
  console.log('  4  Locatie')
  console.log('  5  Event URL')
  console.log(`  6  Afstanden (kommalijst: ${VALID_DISTANCES.join(', ')})`)

  const choice = (await rl.question('\nVeld nummer: ')).trim()

  if (choice === '1') {
    const v = (await rl.question(`Naam [${e.name}]: `)).trim()
    if (v) e.name = v

  } else if (choice === '2') {
    const v = (await rl.question(`Datum [${e.event_date}]: `)).trim()
    if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) e.event_date = v
    else if (v) console.log(yellow('Ongeldig formaat — verwacht YYYY-MM-DD.'))

  } else if (choice === '3') {
    const v = (await rl.question(`Provincie-ID [${e.province_id}]: `)).trim()
    const id = parseInt(v, 10)
    if (id >= 1 && id <= 12) { e.province_id = id; e.province_abbr = String(id) }
    else if (v) console.log(yellow('Moet een getal zijn tussen 1 en 12.'))

  } else if (choice === '4') {
    const v = (await rl.question(`Locatie [${e.location}]: `)).trim()
    if (v) e.location = v

  } else if (choice === '5') {
    const v = (await rl.question(`URL [${e.event_url ?? ''}]: `)).trim()
    e.event_url = v || null

  } else if (choice === '6') {
    const current = e.distances.map(d => d.distance).join(',')
    const v = (await rl.question(`Afstanden [${current}]: `)).trim()
    if (v) {
      const newDistances: ImportDistance[] = []
      for (const part of v.split(',').map(s => s.trim())) {
        if (VALID_DISTANCES.includes(part as any)) {
          newDistances.push({ distance: part as ImportDistance['distance'], distanceCategory: CATEGORY_MAP[part] })
        } else {
          console.log(yellow(`Onbekende afstand "${part}" — overgeslagen.`))
        }
      }
      if (newDistances.length > 0) e.distances = newDistances
      else console.log(yellow('Geen geldige afstanden — origineel behouden.'))
    }
  }

  return e
}

// ─── Import confirmation ─────────────────────────────────────────────────────
async function runImport(approved: ScrapedEvent[]): Promise<void> {
  if (approved.length === 0) {
    console.log(yellow('\nGeen events goedgekeurd voor import.'))
    return
  }

  console.log(`\n${bold(`${approved.length} events goedgekeurd:`)}`)
  for (const e of approved) {
    console.log(`  ${green('+')} ${e.name}  ${dim(e.event_date)}  ${dim(PROVINCE_NAMES[e.province_id])}`)
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  let confirmed = false
  try {
    const answer = (await rl.question(`\n${bold('Importeren naar Supabase? [y/N]')} › `)).trim().toLowerCase()
    confirmed = answer === 'y'
  } finally {
    rl.close()
  }

  if (!confirmed) {
    console.log(dim('Import geannuleerd.'))
    return
  }

  console.log()
  let ok = 0
  let fail = 0
  for (const event of approved) {
    try {
      await importEvent(event)
      console.log(green(`✓ ${event.name} (${event.event_date})`))
      ok++
    } catch (err) {
      console.log(red(`✗ ${event.name}: ${err instanceof Error ? err.message : String(err)}`))
      fail++
    }
  }
  console.log(`\n${bold('Klaar!')}  ${green(`${ok} geïmporteerd`)}${fail > 0 ? `  ${red(`${fail} mislukt`)}` : ''}`)
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  let raw: string
  try {
    raw = await fs.readFile(SCRAPED_FILE, 'utf-8')
  } catch {
    console.error(red('scripts/scraped-events.json niet gevonden.'))
    console.error(dim('Voer eerst "pnpm scrape-events" uit.'))
    process.exit(1)
  }

  const allEvents: ScrapedEvent[] = JSON.parse(raw)
  if (allEvents.length === 0) {
    console.log(yellow('Geen events gevonden in scraped-events.json.'))
    process.exit(0)
  }

  console.log('Bestaande events ophalen uit Supabase...')
  const existing = await fetchExistingKeys()
  const newEvents = allEvents.filter(e => !existing.has(`${e.name}|${e.event_date}`))
  const skippedCount = allEvents.length - newEvents.length

  if (newEvents.length === 0) {
    console.log(green('Alle events zijn al geïmporteerd.'))
    process.exit(0)
  }

  console.log(`\n${bold(`${newEvents.length} nieuwe events`)} gevonden${skippedCount > 0 ? dim(` (${skippedCount} al aanwezig, overgeslagen)`) : ''}`)
  console.log(dim('Gebruik [y] goedkeuren  [s] overslaan  [e] bewerken  [q] stoppen & importeren\n'))

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const approved: ScrapedEvent[] = []

  try {
    outer: for (let i = 0; i < newEvents.length; i++) {
      let event = newEvents[i]

      while (true) {
        printEvent(event, i, newEvents.length)
        const answer = (await rl.question(`${bold('[y/s/e/q]')} › `)).trim().toLowerCase()

        if (answer === 'y' || answer === '') {
          approved.push(event)
          console.log(green('✓ Goedgekeurd'))
          break
        } else if (answer === 's') {
          console.log(dim('Overgeslagen'))
          break
        } else if (answer === 'e') {
          event = await editEvent(event, rl)
        } else if (answer === 'q') {
          console.log(dim(`\nStoppen na ${i} van ${newEvents.length} events.`))
          break outer
        } else {
          console.log(dim('Gebruik y, s, e of q.'))
        }
      }
    }
  } finally {
    rl.close()
  }

  await runImport(approved)
}

main().catch(err => {
  console.error(red(`Fout: ${err instanceof Error ? err.message : String(err)}`))
  process.exit(1)
})
