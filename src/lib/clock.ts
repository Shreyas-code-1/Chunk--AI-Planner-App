/**
 * Clock times as the v3 screens print them: "4:23", 12-hour, no AM/PM. An
 * evening of homework never needs the suffix, and the spec's strings leave it
 * off ("Next up at 4:23", "Done at 6:55").
 */
export function timeLabel(date: Date): string {
  const hours = date.getHours() % 12 || 12;
  return `${hours}:${String(date.getMinutes()).padStart(2, '0')}`;
}
