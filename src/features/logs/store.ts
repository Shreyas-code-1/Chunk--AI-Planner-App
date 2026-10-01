/**
 * The log wallet. Two numbers, both persisted on the device:
 *
 *   balance         what can be spent (nothing spends yet)
 *   lifetimeEarned  everything ever earned; never decreases, even once spending
 *                   exists, because a future feature depends on it
 *
 * AsyncStorage rather than Supabase because the rest of the user's data is not
 * in Supabase yet either. TODO(batch 6): move with the work store.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type LogsState = {
  balance: number;
  lifetimeEarned: number;
  /** Adds earned logs. Ignores anything that isn't a positive whole number. */
  earn(logs: number): void;
};

export const LOGS_STORAGE_KEY = 'chunk.logs';

export const useLogs = create<LogsState>()(
  persist(
    (set) => ({
      balance: 0,
      lifetimeEarned: 0,
      earn(logs) {
        if (!Number.isInteger(logs) || logs <= 0) return;
        set((s) => ({ balance: s.balance + logs, lifetimeEarned: s.lifetimeEarned + logs }));
      },
    }),
    {
      name: LOGS_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ balance: s.balance, lifetimeEarned: s.lifetimeEarned }),
    },
  ),
);
