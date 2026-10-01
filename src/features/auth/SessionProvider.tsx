/**
 * Auth session.
 *
 * One Supabase user per person, however they signed in. Email works today;
 * Apple and Google are native modules that cannot run in Expo Go, so they
 * exist as call sites that fail with a clear message until the 2.10 dev build
 * (see docs/decision-log.md).
 *
 * If the app has not been configured, this provider reports that through
 * `configError` and renders its children anyway. Auth is not a prerequisite
 * for the app existing, and a missing variable should never take down the
 * route tree.
 */

import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getSupabase, isSupabaseConfigured } from '../../lib/supabase';

type SessionState = {
  session: Session | null;
  /** True until the stored session has been read; splash waits on this. */
  loading: boolean;
  /** Set when the app is not configured. Names the problem, never a value. */
  configError: string | null;
  signInWithEmail(email: string, password: string): Promise<void>;
  signUpWithEmail(email: string, password: string): Promise<void>;
  signInWithApple(): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
};

const needsDevBuild = (provider: string) => async (): Promise<void> => {
  throw new Error(`${provider} sign-in needs a development build; it cannot run in Expo Go.`);
};

const NOT_CONFIGURED =
  'Supabase is not configured. Fill in EXPO_PUBLIC_SUPABASE_URL and ' +
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env, then restart the bundler with ' +
  '`npx expo start --clear`.';

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;

    let cancelled = false;
    let generation = 0;
    const restoreGeneration = generation;
    let supabase: ReturnType<typeof getSupabase>;
    try { supabase = getSupabase(); }
    catch { console.warn('[session] configuration-failed'); setLoading(false); return; }

    supabase.auth.getSession().then(({ data, error }) => {
      if (cancelled || generation !== restoreGeneration) return;
      if (error) console.warn('[session] restore-failed');
      setSession(error ? null : data.session);
      setLoading(false);
    }).catch(() => {
      if (cancelled || generation !== restoreGeneration) return;
      console.warn('[session] restore-failed');
      setSession(null); setLoading(false);
    });

    // Fires on sign-in, sign-out and every token refresh, so this is the only
    // place session state is written.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (cancelled) return;
      generation += 1;
      setSession(next);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [configured]);

  const value = useMemo<SessionState>(() => {
    const requireConfig = () => {
      if (!configured) throw new Error(NOT_CONFIGURED);
      return getSupabase();
    };

    return {
      session,
      loading,
      configError: configured ? null : NOT_CONFIGURED,
      async signInWithEmail(email, password) {
        const { error } = await requireConfig().auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUpWithEmail(email, password) {
        const { error } = await requireConfig().auth.signUp({ email, password });
        if (error) throw error;
      },
      signInWithApple: needsDevBuild('Apple'),
      signInWithGoogle: needsDevBuild('Google'),
      async signOut() {
        // Clears the stored session as well as the server-side one.
        const { error } = await requireConfig().auth.signOut();
        if (error) throw error;
      },
    };
  }, [session, loading, configured]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside a SessionProvider');
  return value;
}
