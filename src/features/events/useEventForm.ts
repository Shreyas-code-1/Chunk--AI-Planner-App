/**
 * The event form's state: new events, a whole series, or one occurrence.
 * The form maps Never / Daily / Weekly / Custom onto the stored repeat rule.
 */

import { useState } from 'react';

import { planDateOf, weekdayOf, type PlanDate } from '../../lib/planDate';
import type { EventSeries, RepeatEnd, RepeatRule } from '../../planner/events';
import { useEvents, type EventInput } from './store';
import { eventProblem } from './validate';

export type RepeatKind = 'never' | 'daily' | 'weekly' | 'custom';
export type EndKind = RepeatEnd['kind'];

/** Editing an existing event: every occurrence, or only the one tapped. */
export type Editing = { series: EventSeries; occurrenceDate: PlanDate; scope: 'one' | 'all' };

function repeatKindOf(repeat: RepeatRule): RepeatKind {
  if (repeat.freq === 'none') return 'never';
  if (repeat.interval !== 1) return 'custom';
  return repeat.freq;
}

function initial(editing: Editing | null) {
  const today = planDateOf(new Date());
  const s = editing?.series;
  const exception = s && editing.scope === 'one' ? s.exceptions[editing.occurrenceDate] : undefined;
  const o = exception && 'override' in exception ? exception.override : {};
  return {
    title: o.title ?? s?.title ?? '',
    note: o.note ?? s?.note ?? '',
    date: editing?.scope === 'one' ? editing.occurrenceDate : (s?.date ?? today),
    startMinutes: o.startMinutes ?? s?.startMinutes ?? 16 * 60,
    endMinutes: o.endMinutes ?? s?.endMinutes ?? 17 * 60,
    allDay: o.allDay ?? s?.allDay ?? false,
    repeatKind: s ? repeatKindOf(s.repeat) : ('never' as RepeatKind),
    weekdays: s?.repeat.freq === 'weekly' ? s.repeat.weekdays : [weekdayOf(s?.date ?? today)],
    every: s && s.repeat.freq !== 'none' ? String(s.repeat.interval) : '2',
    unit: (s?.repeat.freq === 'daily' ? 'days' : 'weeks') as 'days' | 'weeks',
    endKind: (s?.end.kind ?? 'never') as EndKind,
    endDate: s?.end.kind === 'on' ? s.end.date : (s?.date ?? today),
    endCount: s?.end.kind === 'after' ? String(s.end.count) : '10',
  };
}

export function useEventForm(editing: Editing | null) {
  const [form, setForm] = useState(() => initial(editing));
  const [problem, setProblem] = useState<string | null>(null);
  const store = useEvents.getState();

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setProblem(null);
  };

  const toInput = (): EventInput => {
    const every = Number(form.every);
    const repeat: RepeatRule =
      form.repeatKind === 'never'
        ? { freq: 'none' }
        : form.repeatKind === 'daily'
          ? { freq: 'daily', interval: 1 }
          : form.repeatKind === 'weekly'
            ? { freq: 'weekly', interval: 1, weekdays: form.weekdays }
            : form.unit === 'days'
              ? { freq: 'daily', interval: every }
              : { freq: 'weekly', interval: every, weekdays: form.weekdays };
    const end: RepeatEnd =
      form.endKind === 'on'
        ? { kind: 'on', date: form.endDate }
        : form.endKind === 'after'
          ? { kind: 'after', count: Number(form.endCount) }
          : { kind: 'never' };
    return {
      title: form.title.trim(),
      note: form.note.trim(),
      date: form.date,
      startMinutes: form.startMinutes,
      endMinutes: form.endMinutes,
      allDay: form.allDay,
      repeat,
      end,
    };
  };

  /** True when saved; otherwise the problem is shown. */
  const save = (): boolean => {
    const input = toInput();
    const message = eventProblem(input);
    if (message) {
      setProblem(message);
      return false;
    }
    if (!editing) store.addEvent(input);
    else if (editing.scope === 'one')
      store.editOccurrence(editing.series.id, editing.occurrenceDate, {
        title: input.title,
        note: input.note,
        startMinutes: input.startMinutes,
        endMinutes: input.endMinutes,
        allDay: input.allDay,
      });
    else store.updateSeries(editing.series.id, input);
    return true;
  };

  const remove = () => {
    if (!editing) return;
    if (editing.scope === 'one' && editing.series.repeat.freq !== 'none')
      store.deleteOccurrence(editing.series.id, editing.occurrenceDate);
    else store.deleteSeries(editing.series.id);
  };

  return { form, set, problem, save, remove };
}

export type EventFormState = ReturnType<typeof useEventForm>;
