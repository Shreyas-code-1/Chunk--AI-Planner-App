/**
 * Plain words for what the planner did. Naming the tradeoff is the product:
 * "Practice takes up most of tonight. I moved History to tomorrow, it's not
 * due until Friday."
 */

import { addDays, daysBetween, fromDateKey, planDateOf, type PlanDate } from '../../lib/planDate';
import type { Deferral } from '../../planner/types';

function dayName(key: PlanDate, today: PlanDate): string {
  if (key === addDays(today, 1)) return 'tomorrow';
  const date = fromDateKey(key);
  return daysBetween(today, key) < 7
    ? date.toLocaleDateString('en-US', { weekday: 'long' })
    : date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function deferralLine(deferral: Deferral, title: string, today: PlanDate): string {
  const lead = deferral.crowdedBy
    ? `${deferral.crowdedBy} takes up most of tonight.`
    : "Tonight's full.";
  const to = dayName(deferral.toPlanDate, today);
  const due = dayName(planDateOf(deferral.dueAt), today);
  return `${lead} I moved ${title} to ${to}, it's not due until ${due}.`;
}

/** "4:30–6:00", the clock without AM/PM, as everywhere else. */
export function eventTimes(start: Date, end: Date, label: (d: Date) => string): string {
  return `${label(start)}–${label(end)}`;
}
