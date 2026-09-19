/**
 * TanStack Query setup.
 *
 * Server state lives here; local UI state lives in Zustand. Nothing in the app
 * should keep a copy of a Supabase row in component state.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A student's plan does not change behind their back — it changes because
      // they finished something, which invalidates explicitly.
      staleTime: 60_000,
      retry: 2,
      // React Native has no window focus; refetching on it does nothing useful.
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Query keys in one place, so an invalidation can never miss a consumer. */
export const keys = {
  profile: ['profile'] as const,
  preferences: ['preferences'] as const,
  classes: ['classes'] as const,
  assignments: ['assignments'] as const,
  chunks: (planDate?: string) => (planDate ? (['chunks', planDate] as const) : (['chunks'] as const)),
  completions: ['completions'] as const,
  streak: ['streak'] as const,
  badges: ['badges'] as const,
};
