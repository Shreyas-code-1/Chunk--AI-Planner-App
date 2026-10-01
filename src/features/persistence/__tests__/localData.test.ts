import { createLocalData, INSTALLATION_KEY, snapshotKey } from '../localData';
import { useWork } from '../../work/store';
import { useDraft } from '../../onboarding/draft';
import { useAiConsent } from '../../ai/consent';
import * as SecureStore from 'expo-secure-store';

jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => require('crypto').randomUUID() }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(async () => null), setItemAsync: jest.fn(async () => {}), deleteItemAsync: jest.fn() }));
const installation = '7132ac11-fabb-4c6b-b5ec-234be6411122';
const key = snapshotKey(installation);
let disk: Map<string,string>;
let storage: { getItem: jest.Mock; setItem: jest.Mock };
let local: ReturnType<typeof createLocalData>;
let warning: jest.SpyInstance;
const assignment = () => useWork.getState().addAssignment({ title: 'Essay', className: 'English', dueAt: new Date('2026-10-10T00:00:00Z'), minutes: 50, dread: 'dreading', mode: 'writing', notes: '', firstAction: 'Open document' });
async function restart() {
  await local.flush(); local.dispose(); useWork.getState().reset(); useDraft.getState().reset();
  local = createLocalData(storage); await local.hydrate();
}
beforeEach(() => {
  useWork.getState().reset(); useDraft.getState().reset();
  disk = new Map([[INSTALLATION_KEY, installation]]);
  storage = { getItem: jest.fn(async key => disk.get(key) ?? null), setItem: jest.fn(async (key,value) => { disk.set(key,value); }) };
  local = createLocalData(storage); warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(async () => { await local.flush(); local.dispose(); warning.mockRestore(); });

test('assignments retain stable UUIDs, dates and metadata across restart', async () => {
  await local.hydrate(); const added = assignment(); await restart();
  expect(useWork.getState().assignments).toEqual([added]);
  expect(added.id).toMatch(/^[0-9a-f-]{36}$/);
  expect(useWork.getState().assignments[0].dueAt).toBeInstanceOf(Date);
  expect(JSON.parse(disk.get(key)!).work.assignments[0].dueAt).toBe('2026-10-10T00:00:00.000Z');
});
test('onboarding answers, progress, classes and preferences survive restart', async () => {
  await local.hydrate(); const draft = useDraft.getState();
  draft.setName('Student'); draft.toggleGoal('get_started'); draft.addClass({ name: 'English' });
  draft.setChunkLength('short'); draft.setStep('/week'); draft.cycleDay(0); draft.setDailyMinutes(60);
  const classes = useDraft.getState().classes;
  await restart();
  expect(useDraft.getState()).toMatchObject({ displayName: 'Student', goals: ['get_started'], classes, chunkLength: 'short', dailyMinutes: 60, lastStep: '/week', answered: { chunkLength: true, week: true } });
  expect(classes[0].id).toMatch(/^[0-9a-f-]{36}$/);
});
test('completion history survives restart and assignment deletion, with exactly-once finishing', async () => {
  await local.hydrate(); const added = assignment();
  useWork.getState().startChunk({ assignmentId: added.id, title: added.title, plannedMinutes: 15 });
  const completion = useWork.getState().finishActive(15)?.completion;
  expect(useWork.getState().finishActive(15)).toBeNull();
  useWork.getState().removeAssignment(added.id); await restart();
  expect(useWork.getState().assignments).toEqual([]);
  expect(useWork.getState().completions).toEqual([completion]);
  expect(useWork.getState().completions[0].endedAt).toBeInstanceOf(Date);
});
test('abandonment and keep-for-later decisions survive, active/generated work does not', async () => {
  await local.hydrate(); const added = assignment();
  const chunk = { assignmentId: added.id, title: added.title, plannedMinutes: 15 };
  useWork.getState().startChunk(chunk); useWork.getState().abandonActive();
  useWork.getState().keepForLater(added.id + ':0'); useWork.getState().startChunk(chunk);
  await local.flush(); const saved = JSON.parse(disk.get(key)!);
  expect(Object.keys(saved.work).sort()).toEqual(['abandoned','assignments','completions','keptForLater']);
  await restart(); expect(useWork.getState().active).toBeNull();
  expect(useWork.getState().abandoned).toHaveLength(1);
  expect(useWork.getState().abandoned[0].startedAt).toBeInstanceOf(Date);
  expect(useWork.getState().keptForLater).toEqual([added.id + ':0']);
});
test.each(['not json', '{}', '{"version":99}', '{"private":"must not log"}'])('malformed storage recovers without exposing data', async raw => {
  disk.set(key, raw); await expect(local.hydrate()).resolves.toBeUndefined();
  expect(useWork.getState().assignments).toEqual([]);
  expect(warning).toHaveBeenCalledWith('[local-data] invalid-snapshot');
  expect(warning.mock.calls).toEqual([['[local-data] invalid-snapshot']]);
});
test('invalid dates reject the whole snapshot safely', async () => {
  await local.hydrate(); assignment(); await local.flush(); local.dispose();
  const saved = JSON.parse(disk.get(key)!); saved.work.assignments[0].dueAt = 'yesterday'; disk.set(key, JSON.stringify(saved));
  local = createLocalData(storage); await local.hydrate();
  expect(useWork.getState().assignments).toEqual([]);
});
test('writes serialize: a delayed old write cannot overwrite the newest state', async () => {
  await local.hydrate(); let release!: () => void;
  storage.setItem.mockImplementationOnce((key,value) => new Promise<void>(resolve => { release = () => { disk.set(key,value); resolve(); }; }));
  useDraft.getState().setName('old'); await Promise.resolve();
  useDraft.getState().setName('new'); await Promise.resolve();
  expect(storage.setItem).toHaveBeenCalledTimes(1);
  release(); await local.flush();
  expect(JSON.parse(disk.get(key)!).draft.displayName).toBe('new');
});
test('a failed write does not poison subsequent saves', async () => {
  await local.hydrate(); storage.setItem.mockRejectedValueOnce(new Error('private'));
  useDraft.getState().setName('old'); await local.flush();
  useDraft.getState().setName('new'); await restart();
  expect(useDraft.getState().displayName).toBe('new');
  expect(warning).toHaveBeenCalledWith('[local-data] write-failed');
});
test('read failure does not overwrite unread data and can be retried', async () => {
  storage.getItem.mockRejectedValueOnce(new Error('private')); await local.hydrate();
  expect(storage.setItem).not.toHaveBeenCalled();
  await local.hydrate(); assignment(); await local.flush(); expect(disk.has(key)).toBe(true);
});
test('hydration is single-flight and does not write default data over a pending read', async () => {
  let release!: (value: string) => void;
  storage.getItem.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
  const first = local.hydrate(); expect(local.hydrate()).toBe(first);
  expect(storage.setItem).not.toHaveBeenCalled(); release(installation); await first;
});
test('existing AI consent reload retains original choice and timestamp', async () => {
  const choice = { granted: true, decidedAt: '2026-09-20T12:00:00.000Z' };
  jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce(JSON.stringify({ state: { choice, pending: choice }, version: 0 }));
  await useAiConsent.persist.rehydrate(); expect(useAiConsent.getState().choice).toEqual(choice);
  expect(useAiConsent.getState().pending).toEqual(choice);
});

test('a new installation gets a persistent UUID namespace', async () => {
  disk.delete(INSTALLATION_KEY); await local.hydrate();
  const identifier = disk.get(INSTALLATION_KEY)!;
  expect(identifier).toMatch(/^[0-9a-f-]{36}$/);
  assignment(); await local.flush(); expect(disk.has(snapshotKey(identifier))).toBe(true);
  await restart(); expect(disk.get(INSTALLATION_KEY)).toBe(identifier);
  expect(useWork.getState().assignments).toHaveLength(1);
});
test('malformed existing consent does not grant permission or crash', async () => {
  useAiConsent.setState({ choice: null, pending: null });
  jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce(JSON.stringify({ state: { choice: { granted: true, decidedAt: 'invalid' }, pending: null }, version: 0 }));
  await expect(useAiConsent.persist.rehydrate()).resolves.toBeUndefined();
  expect(useAiConsent.getState().choice).toBeNull();
  expect(warning).toHaveBeenCalledWith('[local-data] invalid-consent');
});

test('completion flag survives repeated restarts and cannot be overwritten by paywall progress', async () => {
  await local.hydrate(); useDraft.getState().complete();
  for (let i=0;i<3;i++) { await restart(); expect(useDraft.getState().completed).toBe(true); useDraft.getState().setStep('/paywall'); expect(useDraft.getState().lastStep).toBeNull(); }
});
test('older snapshots gain safe completion default and deleted onboarding paths migrate without losing data', async () => {
  await local.hydrate(); assignment(); useDraft.getState().setName('Student'); await local.flush(); local.dispose();
  const data=JSON.parse(disk.get(key)!); delete data.draft.completed; data.draft.lastStep='/first-plan'; disk.set(key,JSON.stringify(data));
  useWork.getState().reset(); local=createLocalData(storage); await local.hydrate();
  expect(useWork.getState().assignments).toHaveLength(1); expect(useDraft.getState().lastStep).toBe('/vs-alone'); expect(useDraft.getState().completed).toBe(false);
});
