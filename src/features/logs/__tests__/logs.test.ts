jest.mock('expo-crypto', () => ({ randomUUID: () => require('crypto').randomUUID() }));
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LOGS_PER_MINUTE, logsForRunSeconds } from '../config';
import { LOGS_STORAGE_KEY, useLogs } from '../store';
import { useWork } from '../../work/store';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const T0 = new Date('2026-09-30T18:00:00');
const at = (minutes: number) => new Date(T0.getTime() + minutes * 60_000);

function startChunk(plannedMinutes = 25) {
  jest.setSystemTime(T0);
  const task = useWork.getState().addAssignment({
    title: 'Essay',
    className: null,
    dueAt: at(60 * 24),
    minutes: 60,
    dread: null,
    notes: '',
    mode: 'writing',
    firstAction: null,
  });
  useWork.getState().startChunk({ assignmentId: task.id, title: 'Essay', plannedMinutes });
}

beforeEach(async () => {
  jest.useFakeTimers();
  useWork.getState().reset();
  useLogs.setState({ balance: 0, lifetimeEarned: 0 });
  await AsyncStorage.clear();
});

afterEach(() => jest.useRealTimers());

describe('earning', () => {
  it('earns one log per whole minute the timer ran', () => {
    expect(LOGS_PER_MINUTE).toBe(1);
    startChunk();
    const result = useWork.getState().finishActive(10, at(10.5));
    expect(result?.logs).toBe(10);
    expect(useLogs.getState()).toMatchObject({ balance: 10, lifetimeEarned: 10 });
  });

  it('earns zero when done is tapped without running the timer', () => {
    startChunk();
    useWork.getState().pauseActive(T0);
    expect(useWork.getState().finishActive(1, at(30))?.logs).toBe(0);
    expect(useLogs.getState().balance).toBe(0);
  });

  it('earns zero when done is tapped straight away', () => {
    startChunk();
    expect(useWork.getState().finishActive(1, at(0.5))?.logs).toBe(0);
  });

  it('earns nothing for paused time', () => {
    startChunk();
    useWork.getState().pauseActive(at(5));
    useWork.getState().resumeActive(at(25));
    expect(useWork.getState().finishActive(8, at(28))?.logs).toBe(8);
  });

  it('never earns past the chunk length', () => {
    startChunk(25);
    expect(useWork.getState().finishActive(25, at(90))?.logs).toBe(25);
  });

  it('banks running time when a chunk is left unfinished', () => {
    startChunk();
    jest.setSystemTime(at(7));
    useWork.getState().abandonActive();
    expect(useLogs.getState().balance).toBe(7);
  });

  it('ignores partial and invalid time', () => {
    expect(logsForRunSeconds(59)).toBe(0);
    expect(logsForRunSeconds(-120)).toBe(0);
    expect(logsForRunSeconds(NaN)).toBe(0);
  });
});

describe('storage', () => {
  it('keeps balance and lifetime earned across an app restart', async () => {
    useLogs.getState().earn(12);
    await jest.runAllTimersAsync();
    expect(await AsyncStorage.getItem(LOGS_STORAGE_KEY)).toContain('"lifetimeEarned":12');

    // A restart: a fresh copy of the store, reading only what's on the device.
    let restarted: typeof useLogs | undefined;
    jest.isolateModules(() => {
      restarted = require('../store').useLogs;
    });
    await restarted!.persist.rehydrate();
    expect(restarted!.getState()).toMatchObject({ balance: 12, lifetimeEarned: 12 });
  });

  it('never decreases lifetime earned', () => {
    const seen: number[] = [];
    for (const amount of [3, -5, 0, 2.5, NaN, 4]) {
      useLogs.getState().earn(amount);
      seen.push(useLogs.getState().lifetimeEarned);
    }
    expect(seen).toEqual([3, 3, 3, 3, 3, 7]);
  });
});
