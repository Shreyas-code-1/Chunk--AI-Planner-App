import { createLocalData, INSTALLATION_KEY, snapshotKey } from '../localData';
import { useEvents } from '../../events/store';
import { useWork } from '../../work/store';
import { useDraft } from '../../onboarding/draft';

jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => require('crypto').randomUUID() }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(async () => null), setItemAsync: jest.fn(async () => {}), deleteItemAsync: jest.fn() }));
const installation = '7132ac11-fabb-4c6b-b5ec-234be6411122';
const key = snapshotKey(installation);
let disk: Map<string, string>;
let storage: { getItem: jest.Mock; setItem: jest.Mock };
let local: ReturnType<typeof createLocalData>;
const resetAll = () => { useWork.getState().reset(); useDraft.getState().reset(); useEvents.getState().reset(); };
async function restart() {
  await local.flush(); local.dispose(); resetAll();
  local = createLocalData(storage); await local.hydrate();
}
beforeEach(() => {
  resetAll();
  disk = new Map([[INSTALLATION_KEY, installation]]);
  storage = { getItem: jest.fn(async k => disk.get(k) ?? null), setItem: jest.fn(async (k, v) => { disk.set(k, v); }) };
  local = createLocalData(storage);
});
afterEach(async () => { await local.flush(); local.dispose(); });

test('a repeating event, its exceptions and the last add tab survive restart as one rule', async () => {
  await local.hydrate();
  const practice = useEvents.getState().addEvent({
    title: 'Soccer practice', note: 'Bring cleats', date: '2026-10-06', startMinutes: 960, endMinutes: 1050,
    allDay: false, repeat: { freq: 'weekly', interval: 1, weekdays: [2, 4] }, end: { kind: 'after', count: 10 },
  });
  useEvents.getState().deleteOccurrence(practice.id, '2026-10-08');
  useEvents.getState().editOccurrence(practice.id, '2026-10-13', { startMinutes: 1020 });
  useEvents.getState().setLastAddTab('event');
  await restart();
  const [saved] = useEvents.getState().series;
  expect(saved).toEqual({
    ...practice,
    exceptions: { '2026-10-08': { deleted: true }, '2026-10-13': { override: { startMinutes: 1020 } } },
  });
  expect(useEvents.getState().lastAddTab).toBe('event');
  expect(JSON.parse(disk.get(key)!).events.series).toHaveLength(1);
});

test('a snapshot from before events loads with none', async () => {
  await local.hydrate();
  useWork.getState().addAssignment({ title: 'Essay', className: null, dueAt: new Date('2026-10-10T00:00:00Z'), minutes: 50, dread: null, mode: 'writing', notes: '', firstAction: null });
  await local.flush();
  const old = JSON.parse(disk.get(key)!); delete old.events; disk.set(key, JSON.stringify(old));
  await restart();
  expect(useWork.getState().assignments).toHaveLength(1);
  expect(useEvents.getState().series).toEqual([]);
  expect(useEvents.getState().lastAddTab).toBe('assignment');
});
