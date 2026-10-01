/**
 * The student's @username, shown on 5.2 PROFILE. Saved on the device like
 * logs, because profile data isn't in Supabase yet.
 *
 * TODO(batch 6): move to a `profiles.username` column with a unique index, so
 * two students can't claim the same name. Until then it is only unique to
 * this phone.
 */

import { serializedStorage } from '../persistence/serializedStorage';
import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const USERNAME_RULE = /^[a-z0-9_]{3,20}$/;

/** Lowercase, trims, drops a leading "@". */
export function normalizeUsername(input: string): string {
  return input.trim().replace(/^@+/, '').toLowerCase();
}

type UsernameState = {
  username: string | null;
  /** Saves a valid name, clears on empty; returns false and saves nothing if invalid. */
  setUsername(input: string): boolean;
};

export const useUsername = create<UsernameState>()(
  persist(
    (set) => ({
      username: null,
      setUsername(input) {
        const name = normalizeUsername(input);
        if (name === '') {
          set({ username: null });
          return true;
        }
        if (!USERNAME_RULE.test(name)) return false;
        set({ username: name });
        return true;
      },
    }),
    {
      name: 'chunk.username',
      storage: createJSONStorage(() => serializedStorage),
      skipHydration: true,
      merge: (saved, current) => {
        if (saved === undefined) return current;
        const parsed = z.object({ username: z.string().regex(USERNAME_RULE).nullable() }).safeParse(saved);
        if (!parsed.success) { console.warn('[local-data] invalid-username'); return current; }
        return { ...current, ...parsed.data };
      },
      onRehydrateStorage: () => (_state, error) => { if (error) console.warn('[local-data] auxiliary-read-failed'); },
      partialize: (s) => ({ username: s.username }),
    },
  ),
);
