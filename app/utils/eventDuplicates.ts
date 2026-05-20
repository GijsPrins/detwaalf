interface EventDuplicateInput {
  name: string;
  eventDate: string;
  provinceId: number | null;
  eventUrl?: string | null;
  location?: string | null;
}

interface EventDuplicateCandidate {
  id: string;
  name: string;
  event_date: string;
  province_id: number;
  event_url?: string | null;
  location?: string | null;
}

export interface EventDuplicateMatch<T extends EventDuplicateCandidate> {
  event: T;
  score: number;
  reason: "url" | "name";
}

const IGNORED_NAME_WORDS = new Set([
  "de",
  "het",
  "een",
  "en",
  "van",
  "der",
  "den",
  "the",
]);

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenizeEventName(value: string): string[] {
  return normalizeText(value)
    .split(/\s+/)
    .filter((word) => word.length > 1 && !IGNORED_NAME_WORDS.has(word));
}

function normalizeUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    return `${url.hostname}${url.pathname}`.replace(/\/+$/, "");
  } catch {
    return normalizeText(value);
  }
}

function tokenSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;

  const aSet = new Set(a);
  const bSet = new Set(b);
  const overlap = [...aSet].filter((token) => bSet.has(token)).length;
  return overlap / Math.min(aSet.size, bSet.size);
}

function nameSimilarity(a: string, b: string): number {
  const normalizedA = normalizeText(a);
  const normalizedB = normalizeText(b);
  if (!normalizedA || !normalizedB) return 0;
  if (normalizedA === normalizedB) return 1;
  if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) {
    return 0.9;
  }

  return tokenSimilarity(tokenizeEventName(a), tokenizeEventName(b));
}

function locationBoost(a: string | null | undefined, b: string | null | undefined): number {
  if (!a?.trim() || !b?.trim()) return 0;
  const normalizedA = normalizeText(a);
  const normalizedB = normalizeText(b);
  if (!normalizedA || !normalizedB) return 0;
  if (normalizedA === normalizedB) return 0.1;
  if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) {
    return 0.06;
  }
  return 0;
}

export function findPotentialDuplicateEvents<T extends EventDuplicateCandidate>(
  input: EventDuplicateInput,
  candidates: T[],
): EventDuplicateMatch<T>[] {
  if (!input.eventDate || input.provinceId == null) return [];

  const inputUrl = normalizeUrl(input.eventUrl);
  const matches = candidates
    .filter(
      (event) =>
        event.event_date === input.eventDate &&
        event.province_id === input.provinceId,
    )
    .map<EventDuplicateMatch<T> | null>((event) => {
      if (inputUrl && inputUrl === normalizeUrl(event.event_url)) {
        return { event, score: 1, reason: "url" };
      }

      const score =
        nameSimilarity(input.name, event.name) +
        locationBoost(input.location, event.location);

      return score >= 0.65 ? { event, score, reason: "name" } : null;
    })
    .filter((match): match is EventDuplicateMatch<T> => match !== null);

  return matches.sort((a, b) => b.score - a.score).slice(0, 3);
}
