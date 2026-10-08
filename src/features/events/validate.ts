/**
 * The event form's checks. Calm and specific: one message, about the first
 * thing that needs fixing.
 */

import { daysBetween } from '../../lib/planDate';
import type { EventInput } from './store';

export function eventProblem(input: EventInput): string | null {
  if (input.title.trim().length === 0) return 'Give it a name so you recognise it later.';
  if (!input.allDay && input.endMinutes <= input.startMinutes)
    return 'End time needs to be after the start time.';
  const { repeat, end } = input;
  if (repeat.freq !== 'none' && !(Number.isInteger(repeat.interval) && repeat.interval >= 1))
    return 'How often should it repeat? Use a whole number, like 1 or 2.';
  if (repeat.freq === 'weekly' && repeat.weekdays.length === 0)
    return 'Pick at least one day for it to repeat on.';
  if (repeat.freq !== 'none' && end.kind === 'on' && daysBetween(input.date, end.date) < 0)
    return 'The repeat needs to end on or after the first day.';
  if (repeat.freq !== 'none' && end.kind === 'after' && !(Number.isInteger(end.count) && end.count >= 1))
    return 'It needs to happen at least once.';
  return null;
}
