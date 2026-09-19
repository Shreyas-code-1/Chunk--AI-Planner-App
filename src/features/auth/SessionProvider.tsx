/**
 * Auth session.
 *
 * One Supabase user per person, however they signed in. Email works today;
 * Apple and Google are native modules that cannot run in Expo Go, so they
 * exist as call sites that fail with a clear message until the 2.10 dev build
 * (see docs/decision-log.md).
 */

import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from '../../lib/supabase';

type SessionState = {
  session: Session | null;
  /** True until the stored session has been read; splash waits on this. */
  loading: boolean;
  signInWithEmail(email: string, password: string): Promise<void>;
  signUpWithEmail(email: string, password: string): Promise<void>;
  signInWithApple(): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
};

const needsDevBuild = (provider: string) => async (): Promise<void> => {
  throw new Error(`${provider} sign-in needs a development build; it cannot run in Expo Go.`);
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setLoading(false);
    });

    // Fires on sign-in, sign-out and every token refresh, so this is the only
    // place session state is written.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      session,
      loading,
      async signInWithEmail(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUpWithEmail(email, password) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      },
      signInWithApple: needsDevBuild('Apple'),
      signInWithGoogle: needsDevBuild('Google'),
      async signOut() {
        // Clears the stored session as well as the server-side one.
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [session, loading],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside a SessionProvider');
  return value;
}
