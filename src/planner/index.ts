/**
 * The planner's public surface.
 *
 * Implementation lives in the modules below, one per step of
 * docs/chunk-algorithm-spec.md. This file only re-exports, so importing the
 * barrel can never create a cycle.
 */

export { plan } from './plan';
export { replan, type Move, type Replan } from './replan';
export { resolve, type Resolved } from './resolve';
export { split } from './split';
export { spread, availableDays, type DayAssignedChunk } from './spread';
export { balance, targetFor, type BalancedDay, type PlacedChunk } from './balance';
export { scheduleDay, orderDay, type DayResult } from './schedule';
export { inferMode, firstActionFor, nextMode, isMathFamily, FIRST_ACTIONS } from './mode';
export { triage, type Triage } from './triage';
export * from './constants';
export type * from './types';
