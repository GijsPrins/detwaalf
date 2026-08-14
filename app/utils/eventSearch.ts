export interface SearchableEvent {
  name: string;
  location?: string | null;
  eventUrl?: string | null;
  registrationUrl?: string | null;
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function matchesEventSearch(
  event: SearchableEvent,
  query: string,
): boolean {
  const needle = normalizeSearchText(query);
  if (!needle) return true;

  const haystack = normalizeSearchText(
    [
      event.name,
      event.location,
      event.eventUrl,
      event.registrationUrl,
    ]
      .filter(Boolean)
      .join(" "),
  );

  return haystack.includes(needle);
}
