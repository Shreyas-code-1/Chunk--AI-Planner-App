/**
 * Every number on v3 5.1 PROGRESS and 5.2 PROFILE, from real app data.
 *
 * TODO(batch 6): completions are memory-only, so these reset when the app
 * restarts; logs are the exception (persisted). The streak is still the
 * `allTimeChunks > 0 ? 1 : 0` stub and "best streak" mirrors it until the
 * points-system streak is built.
 */

import { useSession } from '../auth/SessionProvider';
import { useLogs } from '../logs/store';
import { planDateOf } from '../../lib/planDate';
import { badges, focusedMinutes, hoursByMonth, onTimeSummary } from './progress';
import { useWork } from './store';
import { usePlan } from './usePlan';

export function useProgressStats() {
  const { session } = useSession();
  const assignments = useWork((s) => s.assignments);
  const completions = useWork((s) => s.completions);
  const logBalance = useLogs((s) => s.balance);
  const logsEarned = useLogs((s) => s.lifetimeEarned);
  const { all, allTimeChunks } = usePlan();
  const now = new Date();

  const streak = allTimeChunks > 0 ? 1 : 0;
  const bestStreak = streak;

  const chunkCounts = new Map<string, number>();
  for (const chunk of all)
    chunkCounts.set(chunk.assignmentId, (chunkCounts.get(chunk.assignmentId) ?? 0) + 1);
  const onTime = onTimeSummary(assignments, completions, chunkCounts, now);

  // A chunk counts once its whole slot has passed, not the moment it starts.
  const due = all.filter(
    (c) => c.done || c.scheduledStart.getTime() + c.plannedMinutes * 60_000 <= now.getTime(),
  );
  const finishRate =
    due.length === 0 ? null : Math.round((due.filter((c) => c.done).length / due.length) * 100);

  const joinedAt = session?.user.created_at ? new Date(session.user.created_at) : null;
  const firstWork = completions.length > 0 ? completions[0].endedAt : null;
  const since = joinedAt ?? firstWork;

  return {
    streak,
    bestStreak,
    allTimeChunks,
    focused: focusedMinutes(completions),
    logBalance,
    logsEarned,
    onTime,
    finishRate,
    joinedAt,
    since,
    months: hoursByMonth(completions, planDateOf(now)),
    badges: badges({
      allTimeChunks,
      streak,
      onTime: onTime.onTime,
      longestMinutes: Math.max(0, ...completions.map((c) => c.actualMinutes)),
    }),
  };
}
