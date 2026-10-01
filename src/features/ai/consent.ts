/**
 * AI consent: whether the student lets Chunk send their work to the AI
 * provider.
 *
 * The choice is made before sign-in (right after 2.2), so it is kept on the
 * phone and written to `ai_consents` once a session exists — see
 * AiConsentSync. `pending` holds the latest choice not yet written; choosing
 * again before sign-in replaces it, so only the latest is saved.
 */

import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Provisional until the privacy copy is reviewed (brief §12).
export const AI_PROVIDER = 'anthropic';
export const AI_POLICY_VERSION = '2026-09-29-draft';
// TODO: placeholder until the real privacy policy is hosted.
export const PRIVACY_POLICY_URL = 'https://example.com/chunk-privacy';

export type AiChoice = { granted: boolean; decidedAt: string };

type AiConsentState = {
  choice: AiChoice | null;
  pending: AiChoice | null;
  choose(granted: boolean, now?: Date): void;
  /** Clears `pending` only if it is still the choice that was written. */
  markSynced(decidedAt: string): void;
};

const choiceSchema = z.object({ granted: z.boolean(), decidedAt: z.iso.datetime() });
const consentSchema = z.object({ choice: choiceSchema.nullable(), pending: choiceSchema.nullable() });
// Preserve the established SecureStore location and consent timestamps, but serialize writes.
let consentWrites: Promise<void> = Promise.resolve();
const secureStorage = createJSONStorage(() => ({
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => {
    consentWrites = consentWrites.then(() => SecureStore.setItemAsync(key, value)).catch(() => {
      console.warn('[local-data] consent-write-failed');
    });
    return consentWrites;
  },
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}));

export const useAiConsent = create<AiConsentState>()(
  persist(
    (set) => ({
      choice: null,
      pending: null,
      choose(granted, now = new Date()) {
        const choice = { granted, decidedAt: now.toISOString() };
        set({ choice, pending: choice });
      },
      markSynced(decidedAt) {
        set((s) => (s.pending?.decidedAt === decidedAt ? { pending: null } : s));
      },
    }),
    {
      name: 'chunk.ai-consent',
      merge: (saved, current) => {
        if (saved === undefined) return current;
        const parsed = consentSchema.safeParse(saved);
        if (!parsed.success) {
          console.warn('[local-data] invalid-consent');
          return current;
        }
        return { ...current, ...parsed.data };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.warn('[local-data] consent-read-failed');
      },
      storage: secureStorage,
      partialize: (s) => ({ choice: s.choice, pending: s.pending }),
    },
  ),
);

/** AI features show only when the student has said yes. */
export function useAiEnabled(): boolean {
  return useAiConsent((s) => s.choice?.granted === true);
}
