export function formatFinishTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(remainingSeconds).padStart(2, "0");

  return hours > 0
    ? `${hours}:${paddedMinutes}:${paddedSeconds}`
    : `${minutes}:${paddedSeconds}`;
}

export function parseFinishTime(input: string): number | null {
  const value = input.trim();
  if (/^\d+:[0-5]\d$/.test(value)) {
    const [minutes, seconds] = value.split(":").map(Number);
    return minutes! * 60 + seconds!;
  }
  if (/^\d+:[0-5]\d:[0-5]\d$/.test(value)) {
    const [hours, minutes, seconds] = value.split(":").map(Number);
    return hours! * 3600 + minutes! * 60 + seconds!;
  }
  return null;
}
