import { EVENT_DISTANCE_ORDER } from "~/constants/distances";
import type { EventDistance } from "~/types/events";

// Best-effort hints read from an organiser's event page. Every value is a
// suggestion for the admin to confirm, never something we save blindly.
export interface EventPageHints {
  name: string | null;
  dates: string[];
  distances: EventDistance[];
  otherDistancesKm: number[];
  location: string | null;
}

interface StructuredEvent {
  name: string | null;
  startDate: string | null;
  location: string | null;
}

const MAX_DATE_OPTIONS = 5;
const MAX_YEARS_AHEAD = 2;

// Lookbehind instead of \b so "21,10 km" does not read as "10 km".
const NUMBER_START = "(?<![\\d,.])";
const KM_UNIT = "\\s*(?:km|kilometer|kilometers)\\b";

const DISTANCE_PATTERNS: Record<EventDistance, RegExp[]> = {
  "10k": [new RegExp(`${NUMBER_START}10(?:[,.]0+)?(?:${KM_UNIT}|\\s*k\\b)`)],
  "15k": [new RegExp(`${NUMBER_START}15(?:[,.]0+)?(?:${KM_UNIT}|\\s*k\\b)`)],
  "10_miles": [
    new RegExp(`${NUMBER_START}10\\s*(?:engelse\\s+)?(?:mijl|miles?)\\b`),
    /\bten\s+miles\b/,
    new RegExp(`${NUMBER_START}16[,.]1\\d*${KM_UNIT}`),
  ],
  half_marathon: [
    /\bhalve[\s-]*marathon\b/,
    /\bhalf[\s-]*marathon\b/,
    // 21 km, 21,1 km and 21,0975 km all mean a half marathon.
    new RegExp(`${NUMBER_START}21(?:[,.][01]\\d*)?${KM_UNIT}`),
    new RegExp(`${NUMBER_START}21[,.]0975\\b`),
  ],
  "30k": [new RegExp(`${NUMBER_START}30(?:[,.]0+)?(?:${KM_UNIT}|\\s*k\\b)`)],
  marathon: [
    /\bmarathon\b/,
    new RegExp(`${NUMBER_START}42(?:[,.]\\d+)?${KM_UNIT}`),
  ],
};

// Lengths that already map to one of our event distances.
const KNOWN_DISTANCE_KM = [10, 15, 16.1, 21, 21.1, 21.0975, 30, 42, 42.2, 42.195];

const MONTHS: Record<string, number> = {
  januari: 1,
  january: 1,
  jan: 1,
  februari: 2,
  february: 2,
  feb: 2,
  maart: 3,
  march: 3,
  mrt: 3,
  mar: 3,
  april: 4,
  apr: 4,
  mei: 5,
  may: 5,
  juni: 6,
  june: 6,
  jun: 6,
  juli: 7,
  july: 7,
  jul: 7,
  augustus: 8,
  august: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  oktober: 10,
  october: 10,
  okt: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const WRITTEN_DATE_PATTERN = new RegExp(
  `(?<!\\d)(\\d{1,2})(?:e|ste|de|st|nd|rd|th)?\\s+(${Object.keys(MONTHS).join("|")})\\.?\\s+(\\d{4})(?!\\d)`,
  "g",
);
const NUMERIC_DATE_PATTERN = /(?<![\d/.-])(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?![\d/-]|\.\d)/g;
const ISO_DATE_PATTERN = /\b(\d{4})-(\d{2})-(\d{2})/;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  euro: "€",
  ndash: "–",
  mdash: "—",
};

export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    const lower = String(entity).toLowerCase();
    if (lower.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(lower.slice(2), 16));
    }
    if (lower.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(lower.slice(1), 10));
    }
    return NAMED_ENTITIES[lower] ?? match;
  });
}

function toVisibleText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function readMetaContent(html: string, property: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const name = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1];
    if (name?.toLowerCase() !== property) continue;
    const content = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1];
    if (content?.trim()) return decodeHtmlEntities(content).trim();
  }
  return null;
}

function readTitle(html: string): string | null {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title?.trim() ? decodeHtmlEntities(title).replace(/\s+/g, " ").trim() : null;
}

const GENERIC_TITLES = new Set([
  "home",
  "homepage",
  "home page",
  "startpagina",
  "start",
  "welkom",
  "welcome",
  "index",
]);

// "Venloop 2027 | Home" -> "Venloop 2027"; "Home | Venloop" -> "Venloop"
export function cleanPageTitle(title: string): string | null {
  const segments = title
    .split(/\s+[|–—-]\s+|\s*\|\s*/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length >= 3);
  return (
    segments.find((segment) => !GENERIC_TITLES.has(segment.toLowerCase())) ??
    null
  );
}

function pickEventName(html: string, structuredName: string | null): string | null {
  const candidates = [
    structuredName,
    readMetaContent(html, "og:title"),
    readTitle(html),
    readMetaContent(html, "og:site_name"),
  ];
  for (const candidate of candidates) {
    const cleaned = candidate ? cleanPageTitle(candidate) : null;
    if (cleaned) return cleaned;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasEventType(node: Record<string, unknown>): boolean {
  const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
  return types.some(
    (type) => typeof type === "string" && /(^|\b)(Sports)?Event$/.test(type),
  );
}

function readStructuredLocation(location: unknown): string | null {
  const place = Array.isArray(location) ? location[0] : location;
  if (typeof place === "string") return place.trim() || null;
  if (!isRecord(place)) return null;

  const address = place.address;
  if (isRecord(address) && typeof address.addressLocality === "string") {
    return address.addressLocality.trim() || null;
  }
  return typeof place.name === "string" ? place.name.trim() || null : null;
}

function findStructuredEvent(node: unknown): StructuredEvent | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findStructuredEvent(item);
      if (found) return found;
    }
    return null;
  }
  if (!isRecord(node)) return null;

  if (hasEventType(node)) {
    return {
      name: typeof node.name === "string" ? decodeHtmlEntities(node.name).trim() : null,
      startDate: typeof node.startDate === "string" ? node.startDate : null,
      location: readStructuredLocation(node.location),
    };
  }
  return findStructuredEvent(node["@graph"]);
}

function readStructuredEvent(html: string): StructuredEvent | null {
  const blocks = html.matchAll(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const block of blocks) {
    try {
      const found = findStructuredEvent(JSON.parse(block[1] ?? ""));
      if (found) return found;
    } catch {
      // Ignore malformed JSON-LD; plenty of sites ship broken blocks.
    }
  }
  return null;
}

function toIsoDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function readIsoDate(value: string | null): string | null {
  const match = value?.match(ISO_DATE_PATTERN);
  if (!match) return null;
  return toIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

function collectTextDates(text: string): string[] {
  const dates: string[] = [];

  for (const match of text.matchAll(WRITTEN_DATE_PATTERN)) {
    const month = MONTHS[match[2] ?? ""];
    const date = month ? toIsoDate(Number(match[3]), month, Number(match[1])) : null;
    if (date) dates.push(date);
  }
  for (const match of text.matchAll(NUMERIC_DATE_PATTERN)) {
    const date = toIsoDate(Number(match[3]), Number(match[2]), Number(match[1]));
    if (date) dates.push(date);
  }
  return dates;
}

function collectTimeElementDates(html: string): string[] {
  return [...html.matchAll(/<time\b[^>]*\bdatetime\s*=\s*["']([^"']+)["']/gi)]
    .map((match) => readIsoDate(match[1] ?? null))
    .filter((date): date is string => date !== null);
}

// Most-mentioned upcoming dates first; the event date is usually repeated
// more often than registration deadlines.
export function rankUpcomingDates(
  dates: string[],
  today: string,
  preferred: string | null = null,
): string[] {
  const maxYear = Number(today.slice(0, 4)) + MAX_YEARS_AHEAD;
  const counts = new Map<string, number>();
  for (const date of dates) {
    if (date < today || Number(date.slice(0, 4)) > maxYear) continue;
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  const ranked = [...counts.entries()]
    .sort(([dateA, countA], [dateB, countB]) =>
      countB !== countA ? countB - countA : dateA.localeCompare(dateB),
    )
    .map(([date]) => date);

  if (preferred && preferred >= today) {
    return [preferred, ...ranked.filter((date) => date !== preferred)].slice(
      0,
      MAX_DATE_OPTIONS,
    );
  }
  return ranked.slice(0, MAX_DATE_OPTIONS);
}

export function detectEventDistances(text: string): EventDistance[] {
  const lower = text.toLowerCase();
  // Strip half-marathon phrases first so they do not also count as a marathon.
  const withoutHalf = lower.replace(/\b(?:halve|half)[\s-]*marathon\b/g, " ");

  return EVENT_DISTANCE_ORDER.filter((distance) => {
    const haystack = distance === "marathon" ? withoutHalf : lower;
    return DISTANCE_PATTERNS[distance].some((pattern) => pattern.test(haystack));
  });
}

export function detectOtherDistancesKm(text: string): number[] {
  const found = new Set<number>();
  const pattern = new RegExp(`${NUMBER_START}(\\d{1,3}(?:[,.]\\d{1,4})?)${KM_UNIT}`, "gi");

  for (const match of text.matchAll(pattern)) {
    const km = Number((match[1] ?? "").replace(",", "."));
    if (!Number.isFinite(km) || km < 1 || km > 200) continue;
    if (KNOWN_DISTANCE_KM.some((known) => Math.abs(known - km) < 0.05)) continue;
    found.add(km);
  }
  return [...found].sort((a, b) => a - b);
}

export function extractEventPageHints(html: string, today: string): EventPageHints {
  const structured = readStructuredEvent(html);
  const text = toVisibleText(html);

  return {
    name: pickEventName(html, structured?.name ?? null),
    dates: rankUpcomingDates(
      [...collectTimeElementDates(html), ...collectTextDates(text.toLowerCase())],
      today,
      readIsoDate(structured?.startDate ?? null),
    ),
    distances: detectEventDistances(text),
    otherDistancesKm: detectOtherDistancesKm(text),
    location: structured?.location ?? null,
  };
}
