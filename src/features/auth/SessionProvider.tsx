/**
 * Auth session.
 *
 * One Supabase user per person. Email, Google, and Apple create real sessions.
 *
 * If the app has not been configured, this provider reports that through
 * `configError` and renders its children anyway. Auth is not a prerequisite
 * for the app existing, and a missing variable should never take down the
 * route tree.
 */

import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getSupabase, isSupabaseConfigured } from '../../lib/supabase';
import { signInWithGoogle } from './googleSignIn';
import { signInWithApple } from './appleSignIn';

type SessionState = {
  session: Session | null;
  status: 'unresolved' | 'authenticated' | 'signed-out' | 'error';
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

const NOT_CONFIGURED =
  'Supabase is not configured. Fill in EXPO_PUBLIC_SUPABASE_URL and ' +
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env, then restart the bundler with ' +
  '`npx expo start --clear`.';

const SessionContext = createContext<SessionState | null>(null);
type Resolution = Pick<SessionState, 'session' | 'status' | 'loading' | 'configError'>;
const failedResolution: Resolution = { session: null, status: 'error', loading: false, configError: null };

function resolveSession(session: Session | null): Resolution {
  if (session === null) return { session: null, status: 'signed-out', loading: false, configError: null };
  if (!session.access_token || !session.refresh_token || !session.user?.id || session.user.is_anonymous) {
    return failedResolution;
  }
  return { session, status: 'authenticated', loading: false, configError: null };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [resolution, setResolution] = useState<Resolution>(() => configured
    ? { session: null, status: 'unresolved', loading: true, configError: null }
    : { ...failedResolution, configError: NOT_CONFIGURED });

  useEffect(() => {
    if (!configured) {
      setResolution({ ...failedResolution, configError: NOT_CONFIGURED });
      return;
    }

    let cancelled = false;
    let revision = 0;
    let unsubscribe: (() => void) | undefined;
    setResolution({ session: null, status: 'unresolved', loading: true, configError: null });
    let supabase: ReturnType<typeof getSupabase>;
    try {
      supabase = getSupabase();
    } catch {
      setResolution({ ...failedResolution, configError: 'Supabase configuration could not be initialized.' });
      return;
    }
    const restorationRevision = revision;
    const canRestore = () => !cancelled && revision === restorationRevision;
    try {
      const { data } = supabase.auth.onAuthStateChange((event, next) => {
        if (cancelled) return;
        // Empty INITIAL_SESSION can also accompany SDK initialization errors.
        // Only the error-checked restoration or SIGNED_OUT confirms no session.
        if (event !== 'SIGNED_OUT' && !next) return;
        revision += 1;
        setResolution(event === 'SIGNED_OUT' ? resolveSession(null) : resolveSession(next));
      });
      unsubscribe = () => data.subscription.unsubscribe();
      void supabase.auth.getSession().then(({ data, error }) => {
        if (canRestore()) setResolution(error ? failedResolution : resolveSession(data.session));
      }).catch(() => {
        if (canRestore()) setResolution(failedResolution);
      });
    } catch {
      if (canRestore()) setResolution(failedResolution);
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [configured]);

  const value = useMemo<SessionState>(() => {
    const requireConfig = () => {
      if (!configured) throw new Error(NOT_CONFIGURED);
      return getSupabase();
    };

    return {
      ...resolution,
      async signInWithEmail(email, password) {
        const { error } = await requireConfig().auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUpWithEmail(email, password) {
        const { error } = await requireConfig().auth.signUp({ email, password });
        if (error) throw error;
      },
      signInWithApple,
      signInWithGoogle,
      async signOut() {
        // Clears the stored session as well as the server-side one.
        const { error } = await requireConfig().auth.signOut();
        if (error) throw error;
      },
    };
  }, [resolution, configured]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside a SessionProvider');
  return value;
}
