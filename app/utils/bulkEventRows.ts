import { EVENT_DISTANCE_ORDER } from "~/constants/distances";
import type { EventWriteInput } from "~/queries/events";
import type { EventDistance } from "~/types/events";
import {
  detectEventDistances,
  readEventDate,
  type EventPageHints,
} from "~/utils/eventPageHints";
import { getDistanceCategoryForEventDistance } from "~/utils/eventDistances";
import { findProvinceByStateName, type ProvinceOption } from "~/utils/provinceLookup";

export type BulkEventRowStatus = "draft" | "fetching" | "saving" | "saved" | "error";

export interface BulkEventRow {
  key: number;
  eventUrl: string;
  registrationUrl: string;
  name: string;
  eventDate: string;
  location: string;
  provinceId: number | null;
  distances: EventDistance[];
  dateOptions: string[];
  otherDistancesKm: number[];
  status: BulkEventRowStatus;
  errorKey: string | null;
  savedEventId: string | null;
}

let nextRowKey = 1;

export function createBulkEventRow(eventUrl = ""): BulkEventRow {
  return {
    key: nextRowKey++,
    eventUrl,
    registrationUrl: "",
    name: "",
    eventDate: "",
    location: "",
    provinceId: null,
    distances: [],
    dateOptions: [],
    otherDistancesKm: [],
    status: "draft",
    errorKey: null,
    savedEventId: null,
  };
}

export function normalizeEventUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    return url.hostname.includes(".") ? url.toString() : null;
  } catch {
    return null;
  }
}

export function parseEventUrlList(text: string): string[] {
  const urls = text
    .split(/[\s,;]+/)
    .map(normalizeEventUrl)
    .filter((url): url is string => url !== null);
  return [...new Set(urls)];
}

// One complete event per line, typed or produced by an AI chat:
// "website; naam; datum; plaats; provincie; afstanden; inschrijflink".
// Tabs work too, for rows copied from a spreadsheet. Empty fields stay empty.
export function parseBulkEventLine(
  line: string,
  provinces: ProvinceOption[],
): BulkEventRow | null {
  const separator = line.includes("\t") ? "\t" : ";";
  const [
    eventUrl = "",
    name = "",
    date = "",
    location = "",
    province = "",
    distances = "",
    registrationUrl = "",
  ] = line.split(separator).map((field) => field.trim());

  // Skip a header line such as "website; naam; datum".
  if (/^(?:website|url)$/i.test(eventUrl)) return null;
  const normalizedUrl = normalizeEventUrl(eventUrl);
  if (!normalizedUrl && !name) return null;

  return {
    ...createBulkEventRow(normalizedUrl ?? ""),
    name,
    eventDate: readEventDate(date) ?? "",
    location,
    provinceId: findProvinceByStateName(province, provinces)?.id ?? null,
    // Also accepts our own keys such as "half_marathon".
    distances: detectEventDistances(distances.replace(/_/g, " ")),
    registrationUrl: normalizeEventUrl(registrationUrl) ?? "",
  };
}

// Lines with ";" or a tab are complete events; other lines are website lists.
export function parseBulkEventText(
  text: string,
  provinces: ProvinceOption[],
): BulkEventRow[] {
  const rows = text.split(/\r?\n/).flatMap((line) => {
    if (/[\t;]/.test(line)) {
      const row = parseBulkEventLine(line, provinces);
      return row ? [row] : [];
    }
    return parseEventUrlList(line).map((url) => createBulkEventRow(url));
  });

  const seenUrls = new Set<string>();
  return rows.filter((row) => {
    if (!row.eventUrl) return true;
    if (seenUrls.has(row.eventUrl)) return false;
    seenUrls.add(row.eventUrl);
    return true;
  });
}

export function toggleEventDistance(
  distances: EventDistance[],
  distance: EventDistance,
): EventDistance[] {
  const next = distances.includes(distance)
    ? distances.filter((item) => item !== distance)
    : [...distances, distance];
  return EVENT_DISTANCE_ORDER.filter((item) => next.includes(item));
}

export function isBulkEventRowReady(row: BulkEventRow): boolean {
  return (
    row.status !== "saved" &&
    row.name.trim().length > 0 &&
    row.eventDate.length > 0 &&
    row.provinceId !== null &&
    row.distances.length > 0
  );
}

// Fills only what the admin has not typed yet; hints never overwrite input.
export function applyEventPageHints(
  row: BulkEventRow,
  hints: EventPageHints,
): BulkEventRow {
  return {
    ...row,
    name: row.name || hints.name || "",
    eventDate: row.eventDate || hints.dates[0] || "",
    location: row.location || hints.location || "",
    registrationUrl: row.registrationUrl || hints.registrationUrl || "",
    distances: row.distances.length > 0 ? row.distances : hints.distances,
    dateOptions: hints.dates,
    otherDistancesKm: hints.otherDistancesKm,
  };
}

export function toEventWriteInput(row: BulkEventRow): EventWriteInput {
  if (row.provinceId === null) {
    throw new Error("A province is required before saving an event.");
  }

  return {
    name: row.name.trim(),
    event_date: row.eventDate,
    province_id: row.provinceId,
    location: row.location.trim() || null,
    event_url: normalizeEventUrl(row.eventUrl),
    registration_url: normalizeEventUrl(row.registrationUrl),
    registration_opens: null,
    registration_deadline: null,
    distances: row.distances.map((distance) => ({
      distance,
      distanceCategory: getDistanceCategoryForEventDistance(distance),
    })),
  };
}
