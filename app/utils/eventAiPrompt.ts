// Fewer events per answer keeps an AI chat's dates and distances reliable.
export const AI_PROMPT_MAX_EVENTS = 10;

interface KnownEvent {
  name: string;
  event_date: string;
  province_id: number;
  event_url?: string | null;
}

function toHostname(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Upcoming events we already have in a province, one line each, so an AI chat
// can skip them: "2027-04-11 NN Marathon Rotterdam (nnmarathonrotterdam.nl)".
export function listKnownEventsForPrompt(
  events: KnownEvent[],
  provinceId: number,
  today: string,
): string[] {
  return events
    .filter((event) => event.province_id === provinceId && event.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .map((event) => {
      const hostname = toHostname(event.event_url);
      const line = `${event.event_date} ${event.name}`;
      return hostname ? `${line} (${hostname})` : line;
    });
}
