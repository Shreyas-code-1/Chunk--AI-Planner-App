/**
 * Events the student has added. Stored as series with a repeat rule, never as
 * copies (docs/events-plan.md, step 3). Saved in the local snapshot with work.
 *
 * Events are not work: they never earn logs and never touch the streak.
 */

import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';

import type { EventSeries, OccurrenceOverride } from '../../planner/events';
import type { PlanDate } from '../../lib/planDate';

export type AddTab = 'assignment' | 'event';
export type EventInput = Omit<EventSeries, 'id' | 'exceptions'>;

type EventsState = {
  series: EventSeries[];
  /** The + screen opens on whichever tab was used last. */
  lastAddTab: AddTab;
  setLastAddTab(tab: AddTab): void;
  addEvent(input: EventInput): EventSeries;
  /** Edits every occurrence. Single-occurrence edits are kept. */
  updateSeries(id: string, input: EventInput): void;
  editOccurrence(id: string, date: PlanDate, override: OccurrenceOverride): void;
  deleteOccurrence(id: string, date: PlanDate): void;
  deleteSeries(id: string): void;
  reset(): void;
};

const patch = (list: EventSeries[], id: string, change: (s: EventSeries) => EventSeries) =>
  list.map((s) => (s.id === id ? change(s) : s));

export const useEvents = create<EventsState>((set) => ({
  series: [],
  lastAddTab: 'assignment',

  setLastAddTab(tab) {
    set({ lastAddTab: tab });
  },

  addEvent(input) {
    const event: EventSeries = { ...input, id: randomUUID(), exceptions: {} };
    set((state) => ({ series: [...state.series, event] }));
    return event;
  },

  updateSeries(id, input) {
    set((state) => ({ series: patch(state.series, id, (s) => ({ ...s, ...input })) }));
  },

  editOccurrence(id, date, override) {
    set((state) => ({
      series: patch(state.series, id, (s) => ({
        ...s,
        exceptions: { ...s.exceptions, [date]: { override } },
      })),
    }));
  },

  deleteOccurrence(id, date) {
    set((state) => ({
      series: patch(state.series, id, (s) => ({
        ...s,
        exceptions: { ...s.exceptions, [date]: { deleted: true } },
      })),
    }));
  },

  deleteSeries(id) {
    set((state) => ({ series: state.series.filter((s) => s.id !== id) }));
  },

  reset() {
    set({ series: [], lastAddTab: 'assignment' });
  },
}));
