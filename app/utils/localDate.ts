export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDateOnlyString(value: string): string {
  return value.slice(0, 10);
}

export function parseDateOnly(value: string): Date {
  const [year, month, day] = getDateOnlyString(value).split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

export function formatDateOnly(
  value: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat("nl-NL", options).format(parseDateOnly(value));
}
