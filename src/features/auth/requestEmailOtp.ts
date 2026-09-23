import { getSupabase } from '../../lib/supabase';

export type RequestEmailOtpResult =
  | { status: 'requested' }
  | { status: 'failed'; reason: 'invalid-email' | 'configuration' | 'request' };

// Match the existing email screen's basic shape validation; Supabase is authoritative.
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Request only: success means Supabase accepted the request, not a verified session
 * or guaranteed delivery. The project's email template must include the OTP token.
 * Invoke on user action; retries/resends are explicit, never automatic.
 */
export async function requestEmailOtp(email: string): Promise<RequestEmailOtpResult> {
  const address = email.trim();
  if (!LOOKS_LIKE_EMAIL.test(address)) {
    return { status: 'failed', reason: 'invalid-email' };
  }

  let supabase: ReturnType<typeof getSupabase>;
  try {
    supabase = getSupabase();
  } catch {
    return { status: 'failed', reason: 'configuration' };
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      // The existing onboarding offers account creation as well as sign-in.
      options: { shouldCreateUser: true },
    });
    return error ? { status: 'failed', reason: 'request' } : { status: 'requested' };
  } catch {
    // Never expose internal errors or authentication information to callers.
    return { status: 'failed', reason: 'request' };
  }
}
