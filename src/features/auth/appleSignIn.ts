import * as WebBrowser from 'expo-web-browser';

import { getSupabase } from '../../lib/supabase';

// Existing native scheme and login route; allow this exact URL in Supabase.
export const APPLE_REDIRECT_URL = 'chunk://login';
const SIGN_IN_ERROR = 'Apple sign-in could not be completed. Please try again.';
let inProgress = false;

/** Uses the existing client's implicit OAuth flow; never logs callback tokens. */
export async function signInWithApple(): Promise<void> {
  if (inProgress) return;
  inProgress = true;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: APPLE_REDIRECT_URL, skipBrowserRedirect: true },
    });
    if (error || !data.url) throw new Error(SIGN_IN_ERROR);
    const response = await WebBrowser.openAuthSessionAsync(data.url, APPLE_REDIRECT_URL);
    if (response.type === 'cancel' || response.type === 'dismiss') return;
    if (response.type !== 'success') throw new Error(SIGN_IN_ERROR);

    const callback = new URL(response.url);
    if (callback.protocol !== 'chunk:' || callback.hostname !== 'login' ||
        callback.pathname !== '' || callback.username || callback.password || callback.port) {
      throw new Error(SIGN_IN_ERROR);
    }
    const params = new URLSearchParams(callback.hash.slice(1));
    if (callback.searchParams.has('error') || callback.searchParams.has('error_code') ||
        params.has('error') || params.has('error_code')) {
      throw new Error(SIGN_IN_ERROR);
    }
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) throw new Error(SIGN_IN_ERROR);

    // Supabase validates the tokens, persists the session, and emits SIGNED_IN.
    // SessionProvider remains the sole source of session state for billing/UI.
    const result = await supabase.auth.setSession({ access_token, refresh_token });
    const session = result.data.session;
    const user = result.data.user;
    if (result.error || !session?.access_token || !session.refresh_token || !user?.id ||
        session.user?.id !== user.id || user.is_anonymous || session.user.is_anonymous) {
      throw new Error(SIGN_IN_ERROR);
    }
  } catch {
    // The login screen displays this message; never propagate provider/SDK details.
    throw new Error(SIGN_IN_ERROR);
  } finally {
    inProgress = false;
  }
}
