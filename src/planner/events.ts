/**
 * Events: fixed-time things like practice, a dentist appointment or a club
 * meeting (docs/events-plan.md).
 *
 * A repeating event is stored once, as a rule, and expanded into occurrences
 * only for the days being shown or planned. Times are wall-clock minutes on a
 * plan-day key, turned into a Date with the local constructor at expansion,
 * so a 4:00 practice stays at 4:00 across a daylight-saving change.
 *
 * Pure: no clock, no storage.
 */

import { addDays, daysBetween, fromDateKey, weekdayOf, type PlanDate } from '../lib/planDate';

export type RepeatRule =
  | { freq: 'none' }
  /** Every `interval` days. Daily is interval 1. */
  | { freq: 'daily'; interval: number }
  /** Every `interval` weeks on these weekdays (0 = Sunday). Weekly is interval 1. */
  | { freq: 'weekly'; interval: number; weekdays: number[] };

export type RepeatEnd =
  | { kind: 'never' }
  /** The last date an occurrence may fall on, inclusive. */
  | { kind: 'on'; date: PlanDate }
  /** Counted from the first occurrence; a deleted one still counts, as calendars do. */
  | { kind: 'after'; count: number };

/** What a single occurrence can change without touching the series. */
export type OccurrenceOverride = {
  title?: string;
  note?: string;
  startMinutes?: number;
  endMinutes?: number;
  allDay?: boolean;
};

export type EventException = { deleted: true } | { override: OccurrenceOverride };

export type EventSeries = {
  id: string;
  title: string;
  note: string;
  /** The first day of the series, or the day of a one-off. */
  date: PlanDate;
  /** Minutes from local midnight. Ignored when allDay. */
  startMinutes: number;
  endMinutes: number;
  /** A banner on the day; never busy time. */
  allDay: boolean;
  repeat: RepeatRule;
  end: RepeatEnd;
  /** Keyed by the occurrence's original date. */
  exceptions: Record<PlanDate, EventException>;
};

export type EventOccurrence = {
  seriesId: string;
  /** The date the rule put it on; the key for exceptions. */
  occurrenceDate: PlanDate;
  title: string;
  note: string;
  allDay: boolean;
  start: Date;
  end: Date;
  repeating: boolean;
};

/** Local wall-clock time on a date. The local constructor keeps DST out of it. */
export function atMinutes(date: PlanDate, minutes: number): Date {
  const day = fromDateKey(date);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes, 0, 0);
}

/** Does the rule (ignoring its end) put an occurrence on this day? */
function onRule(series: EventSeries, day: PlanDate): boolean {
  const diff = daysBetween(series.date, day);
  if (diff < 0) return false;
  const { repeat } = series;
  if (repeat.freq === 'none') return diff === 0;
  const every = Math.max(1, Math.floor(repeat.interval));
  if (repeat.freq === 'daily') return diff % every === 0;
  const weekdays = repeat.weekdays.length > 0 ? repeat.weekdays : [weekdayOf(series.date)];
  if (!weekdays.includes(weekdayOf(day))) return false;
  // Weeks are counted Sunday to Saturday from the week the series starts in.
  const week = Math.floor((diff + weekdayOf(series.date)) / 7);
  return week % every === 0;
}

/** The original dates of a series' occurrences that fall in [from, to]. */
export function occurrenceDates(series: EventSeries, from: PlanDate, to: PlanDate): PlanDate[] {
  const { end } = series;
  const last = end.kind === 'on' && daysBetween(end.date, to) > 0 ? end.date : to;
  const out: PlanDate[] = [];
  if (series.repeat.freq === 'none') {
    return daysBetween(from, series.date) >= 0 && daysBetween(series.date, last) >= 0
      ? [series.date]
      : [];
  }
  // A count ends the series wherever it lands, so it is walked from the start.
  let seen = 0;
  const begin = end.kind === 'after' || daysBetween(series.date, from) < 0 ? series.date : from;
  for (let day = begin; daysBetween(day, last) >= 0; day = addDays(day, 1)) {
    if (!onRule(series, day)) continue;
    seen += 1;
    if (end.kind === 'after' && seen > end.count) break;
    if (daysBetween(from, day) >= 0) out.push(day);
  }
  return out;
}

/** Every occurrence in [from, to], exceptions applied, in time order. */
export function expandEvents(
  series: EventSeries[],
  from: PlanDate,
  to: PlanDate,
): EventOccurrence[] {
  const out: EventOccurrence[] = [];
  for (const s of series) {
    for (const date of occurrenceDates(s, from, to)) {
      const exception = s.exceptions[date];
      if (exception && 'deleted' in exception) continue;
      const o = exception?.override ?? {};
      const allDay = o.allDay ?? s.allDay;
      out.push({
        seriesId: s.id,
        occurrenceDate: date,
        title: o.title ?? s.title,
        note: o.note ?? s.note,
        allDay,
        start: atMinutes(date, allDay ? 0 : (o.startMinutes ?? s.startMinutes)),
        end: allDay ? atMinutes(addDays(date, 1), 0) : atMinutes(date, o.endMinutes ?? s.endMinutes),
        repeating: s.repeat.freq !== 'none',
      });
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}
