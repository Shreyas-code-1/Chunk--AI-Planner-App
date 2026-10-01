/**
 * Logs, the in-app currency. Earned only by focus time the timer actually ran;
 * never bought with real money.
 *
 * Provisional: tune against real sessions. Decision log 2026-09-30.
 */
export const LOGS_PER_MINUTE = 1;

/** Logs for a session's running time. Whole minutes only; partial minutes earn nothing. */
export function logsForRunSeconds(runSeconds: number): number {
  if (!Number.isFinite(runSeconds) || runSeconds <= 0) return 0;
  return Math.floor(runSeconds / 60) * LOGS_PER_MINUTE;
}
