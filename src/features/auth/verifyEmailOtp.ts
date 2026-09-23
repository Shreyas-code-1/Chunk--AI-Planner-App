import { getSupabase } from '../../lib/supabase';

export type VerifyEmailOtpResult =
  | { status: 'verified' }
  | { status: 'invalid-input'; field: 'email' | 'otp' }
  | { status: 'invalid-or-expired' }
  | { status: 'failed'; reason: 'configuration' | 'verification' | 'missing-session' };

const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function verificationFailure(error: unknown): VerifyEmailOtpResult {
  return typeof error === 'object' && error !== null &&
    'code' in error && error.code === 'otp_expired'
    ? { status: 'invalid-or-expired' }
    : { status: 'failed', reason: 'verification' };
}

/** Supabase persists the session and emits SIGNED_IN; do not copy tokens into UI state. */
export async function verifyEmailOtp(email: string, code: string): Promise<VerifyEmailOtpResult> {
  const address = email.trim();
  const token = code.trim();
  if (!LOOKS_LIKE_EMAIL.test(address)) return { status: 'invalid-input', field: 'email' };
  // Supabase supports configurable 6–10 digit email codes. Preserve leading zeros.
  if (!/^[0-9]{6,10}$/.test(token)) return { status: 'invalid-input', field: 'otp' };

  let supabase: ReturnType<typeof getSupabase>;
  try {
    supabase = getSupabase();
  } catch {
    return { status: 'failed', reason: 'configuration' };
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({ email: address, token, type: 'email' });
    if (error) return verificationFailure(error);
    const session = data.session;
    const user = data.user;
    if (!session?.access_token || !session.refresh_token || !user?.id ||
        session.user?.id !== user.id || user.is_anonymous || session.user.is_anonymous) {
      return { status: 'failed', reason: 'missing-session' };
    }
    return { status: 'verified' };
  } catch (error) {
    return verificationFailure(error);
  }
}
