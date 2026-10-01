import AsyncStorage from '@react-native-async-storage/async-storage';
const queues = new Map<string, Promise<void>>();
function serialize(key: string, action: () => Promise<void>) {
  const next = (queues.get(key) ?? Promise.resolve()).then(action).catch(() => {
    console.warn('[local-data] auxiliary-write-failed');
  });
  queues.set(key, next);
  void next.then(() => { if (queues.get(key) === next) queues.delete(key); });
  return next;
}
export const serializedStorage = {
  getItem: async (key: string) => { await queues.get(key); return AsyncStorage.getItem(key); },
  setItem: (key: string, value: string) => serialize(key, () => AsyncStorage.setItem(key, value)),
  removeItem: (key: string) => serialize(key, () => AsyncStorage.removeItem(key)),
};
