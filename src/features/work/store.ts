/** Work and immutable history. Local persistence is managed by the data layer. */

import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';

import { logsForRunSeconds } from '../logs/config';
import { useLogs } from '../logs/store';
import { DEFAULT_DREAD } from '../../planner/constants';
import type { AbandonedChunk } from '../../planner/learning';
import type { Assignment, CompletedChunk, Dread, Mode, RunningChunk } from '../../planner/types';

export type WorkAssignment = {
  id: string;
  title: string;
  /** The class name, which is what the chips and the planner both key on. */
  className: string | null;
  /** End of the due day, local. The planner only reads the day out of it. */
  dueAt: Date;
  minutes: number | null;
  dread: Dread | null;
  notes: string;
  mode: Mode;
  /** The student's edit of the first action; null uses the mode's default. */
  firstAction: string | null;
  addedAt: Date;
};

/**
 * A finished chunk: an immutable snapshot, never a position (decision log
 * 2026-09-26). The planner derives what's left of a task by subtracting these.
 */
export type Completion = CompletedChunk;

/** The chunk on the timer, snapshotted at start. Focus runs from this, not the plan. */
export type ActiveChunk = RunningChunk & {
  mode: Mode;
  dread: Dread;
  firstChunk: boolean;
  /** Running time banked before the current run; pauses don't count. */
  runMs: number;
  /** When the timer last started running; null while paused. */
  runningSince: Date | null;
};

/** Seconds the timer has actually run, capped at the chunk's length. */
export function runSecondsOf(active: ActiveChunk, now: Date): number {
  const live = active.runningSince ? now.getTime() - active.runningSince.getTime() : 0;
  const seconds = Math.floor((active.runMs + Math.max(0, live)) / 1000);
  return Math.min(seconds, Math.round(active.plannedMinutes * 60));
}

/** Banks the session's running time as logs. */
function awardLogs(active: ActiveChunk, now: Date): number {
  const logs = logsForRunSeconds(runSecondsOf(active, now));
  useLogs.getState().earn(logs);
  return logs;
}

type WorkState = {
  assignments: WorkAssignment[];
  completions: Completion[];
  active: ActiveChunk | null;
  /** Started and left unfinished; append-only, for §9 learning. */
  abandoned: (AbandonedChunk & { id: string })[];
  /** Chunk keys whose 5.4 urgent card the student chose to keep at its planned time. */
  keptForLater: string[];
  keepForLater(chunkKey: string): void;
  addAssignment(input: Omit<WorkAssignment, 'id' | 'addedAt'>): WorkAssignment;
  removeAssignment(id: string): void;
  setMode(id: string, mode: Mode): void;
  setDread(id: string, dread: Dread): void;
  setFirstAction(id: string, firstAction: string | null): void;
  /** Snapshot a chunk onto the timer. Starting another abandons the one running. */
  startChunk(chunk: { assignmentId: string; title: string; plannedMinutes: number }): void;
  pauseActive(now?: Date): void;
  resumeActive(now?: Date): void;
  /** Record the running chunk as done and bank its logs. Append-only; null if nothing is running. */
  finishActive(actualMinutes: number, now?: Date): { completion: Completion; logs: number } | null;
  /** Leave the running chunk; it goes back on the plan. */
  abandonActive(): void;
  reset(): void;
};

const newId = randomUUID;

export const useWork = create<WorkState>((set, get) => ({
  assignments: [],
  completions: [],
  active: null,
  abandoned: [],
  keptForLater: [],

  keepForLater(chunkKey) {
    set((state) => ({ keptForLater: [...state.keptForLater, chunkKey] }));
  },

  addAssignment(input) {
    const assignment: WorkAssignment = {
      ...input,
      id: newId(),
      addedAt: new Date(),
    };
    set((state) => ({ assignments: [...state.assignments, assignment] }));
    return assignment;
  },

  removeAssignment(id) {
    set((state) => ({
      assignments: state.assignments.filter((entry) => entry.id !== id),
      active: state.active?.assignmentId === id ? null : state.active,
    }));
  },

  setMode(id, mode) {
    set((state) => ({
      assignments: state.assignments.map((a) => (a.id === id ? { ...a, mode } : a)),
    }));
  },

  setDread(id, dread) {
    set((state) => ({
      assignments: state.assignments.map((a) => (a.id === id ? { ...a, dread } : a)),
    }));
  },

  setFirstAction(id, firstAction) {
    set((state) => ({
      assignments: state.assignments.map((a) => (a.id === id ? { ...a, firstAction } : a)),
    }));
  },

  startChunk(chunk) {
    const state = get();
    if (state.active?.assignmentId === chunk.assignmentId) return; // already running
    const task = state.assignments.find((a) => a.id === chunk.assignmentId);
    if (!task) return;
    if (state.active) state.abandonActive();
    set((s) => ({
      active: {
        ...chunk,
        startedAt: new Date(),
        mode: task.mode,
        dread: task.dread ?? DEFAULT_DREAD,
        firstChunk: !s.completions.some((c) => c.assignmentId === chunk.assignmentId),
        runMs: 0,
        runningSince: new Date(),
      },
    }));
  },

  pauseActive(now = new Date()) {
    const { active } = get();
    if (!active?.runningSince) return;
    const ran = Math.max(0, now.getTime() - active.runningSince.getTime());
    set({ active: { ...active, runMs: active.runMs + ran, runningSince: null } });
  },

  resumeActive(now = new Date()) {
    const { active } = get();
    if (!active || active.runningSince) return;
    set({ active: { ...active, runningSince: now } });
  },

  finishActive(actualMinutes, now = new Date()) {
    const { active } = get();
    if (!active) return null;
    const logs = awardLogs(active, now);
    // Append-only, and exactly once: the snapshot is cleared in the same
    // update, so finishing twice can't inflate the lifetime count — the whole
    // point of the policy on `chunk_completions`.
    const completion: Completion = {
      id: newId(),
      assignmentId: active.assignmentId,
      title: active.title,
      plannedMinutes: active.plannedMinutes,
      actualMinutes,
      startedAt: active.startedAt,
      endedAt: now,
      mode: active.mode,
      dread: active.dread,
      firstChunk: active.firstChunk,
    };
    set((s) => ({ completions: [...s.completions, completion], active: null }));
    return { completion, logs };
  },

  abandonActive() {
    const { active } = get();
    if (!active) return;
    // Time the timer ran still earns, even if the chunk goes back on the plan.
    awardLogs(active, new Date());
    set((s) => ({
      active: null,
      abandoned: [
        ...s.abandoned,
        {
          id: newId(),
          assignmentId: active.assignmentId,
          dread: active.dread,
          firstChunk: active.firstChunk,
          startedAt: active.startedAt,
        },
      ],
    }));
  },

  reset() {
    set({ assignments: [], completions: [], active: null, abandoned: [], keptForLater: [] });
  },
}));

/** The planner's view of the same rows. A rename, not a translation. */
export function toPlannerAssignments(assignments: WorkAssignment[]): Assignment[] {
  return assignments.map((entry) => ({
    id: entry.id,
    classId: entry.className,
    title: entry.title,
    dueAt: entry.dueAt,
    minutes: entry.minutes,
    dread: entry.dread,
    source: 'typed' as const,
    mode: entry.mode,
    firstAction: entry.firstAction,
  }));
}
