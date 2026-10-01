import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { useEffect } from 'react';
import { create } from 'zustand';
import { useLogs } from '../logs/store';
import { useUsername } from '../profile/username';
import { useAiConsent } from '../ai/consent';
import { ONBOARDING_STEPS, type OnboardingStep, useDraft } from '../onboarding/draft';
import { useWork } from '../work/store';
import { encodeSnapshot, hydrateSnapshot } from './snapshot';

export type LocalStorage = Pick<typeof AsyncStorage, 'getItem' | 'setItem'>;
export const INSTALLATION_KEY = 'chunk:installation-id';
// Namespace construction is separate from auth. This phase uses guest ownership only.
export const snapshotKey = (installationId: string) => 'chunk:data:v1:guest:' + installationId;
const report = (category: string) => console.warn('[local-data] ' + category);

export function createLocalData(storage: LocalStorage = AsyncStorage) {
  let initialization: Promise<void> | undefined;
  let writes: Promise<void> = Promise.resolve();
  let unsubscribe: (() => void)[] = [];
  let key: string;
  let last = '';
  const save = () => {
    const value = encodeSnapshot();
    if (value === last) return;
    last = value;
    // Capture state now, execute writes in order, and recover the chain after errors.
    writes = writes.then(() => storage.setItem(key, value)).catch(() => {
      last = ''; report('write-failed');
    });
  };
  return {
    hydrate(): Promise<void> {
      return initialization ??= (async () => {
        try {
          let installation = await storage.getItem(INSTALLATION_KEY);
          if (!installation || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(installation)) {
            installation = randomUUID();
            await storage.setItem(INSTALLATION_KEY, installation);
          }
          key = snapshotKey(installation);
          const raw = await storage.getItem(key);
          if (raw !== null) {
            try { hydrateSnapshot(raw); }
            catch { useDraft.getState().reset(); useWork.getState().reset(); report('invalid-snapshot'); }
          }
          last = encodeSnapshot();
          unsubscribe = [useDraft.subscribe(save), useWork.subscribe(save)];
        } catch {
          // Never overwrite a snapshot we could not read. Startup can use safe defaults.
          report('read-failed');
          initialization = undefined;
        }
      })();
    },
    flush: () => writes,
    dispose: () => { unsubscribe.forEach(stop => stop()); unsubscribe = []; },
  };
}
const localData = createLocalData();
const useHydration = create<{ ready: boolean }>(() => ({ ready: false }));
let startup: Promise<void> | undefined;
export function hydrateLocalData(): Promise<void> {
  return startup ??= (async () => {
    // Consent keeps its existing SecureStore key and original decidedAt/pending semantics.
    await Promise.all([useAiConsent.persist.rehydrate(), useLogs.persist.rehydrate(), useUsername.persist.rehydrate()]);
    await localData.hydrate();
    useHydration.setState({ ready: true });
  })();
}
export function useLocalDataReady(): boolean {
  const ready = useHydration(s => s.ready);
  useEffect(() => { void hydrateLocalData(); }, []);
  return ready;
}

export function useOnboardingProgress(pathname: string, ready: boolean) {
  useEffect(() => {
    if (ready && pathname === '/home' && !useDraft.getState().completed) {
      useDraft.getState().complete();
    }
    if (ready && !useDraft.getState().completed && ONBOARDING_STEPS.includes(pathname as OnboardingStep) && useDraft.getState().lastStep !== pathname) {
      useDraft.getState().setStep(pathname as OnboardingStep);
    }
  }, [pathname, ready]);
}
