import { getSupabase } from '../../../lib/supabase';
import { verifyEmailOtp } from '../verifyEmailOtp';

jest.mock('../../../lib/supabase', () => ({ getSupabase: jest.fn() }));
const verifyOtp = jest.fn();
const user = { id: 'test-user', is_anonymous: false };
const session = { access_token: 'test-access', refresh_token: 'test-refresh', user };

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(getSupabase).mockReturnValue({ auth: { verifyOtp } } as unknown as ReturnType<typeof getSupabase>);
  verifyOtp.mockResolvedValue({ data: { session, user }, error: null });
});

test('uses email verification, trims input, preserves leading zeros, and returns no credentials', async () => {
  await expect(verifyEmailOtp(' Person+Chunk@example.com ', ' 012345 ')).resolves.toEqual({ status: 'verified' });
  expect(verifyOtp).toHaveBeenCalledWith({ email: 'Person+Chunk@example.com', token: '012345', type: 'email' });
  expect(verifyOtp).toHaveBeenCalledTimes(1);
});

test.each(['', 'person', '@example.com', 'per son@example.com'])('rejects malformed email %#', async (email) => {
  await expect(verifyEmailOtp(email, '012345')).resolves.toEqual({ status: 'invalid-input', field: 'email' });
  expect(getSupabase).not.toHaveBeenCalled();
});

test.each(['', '12345', '12345678901', '12 3456', 'abcdef', '１２３４５６'])('rejects malformed OTP %#', async (code) => {
  await expect(verifyEmailOtp('person@example.com', code)).resolves.toEqual({ status: 'invalid-input', field: 'otp' });
  expect(getSupabase).not.toHaveBeenCalled();
});

test('accepts configurable longer numeric codes', async () => {
  await expect(verifyEmailOtp('person@example.com', '0123456789')).resolves.toEqual({ status: 'verified' });
});

test.each(['returned', 'thrown'])('classifies %s invalid/expired code errors and permits retry', async (mode) => {
  const error = { code: 'otp_expired', message: 'private details' };
  if (mode === 'returned') verifyOtp.mockResolvedValueOnce({ data: { session: null, user: null }, error });
  else verifyOtp.mockRejectedValueOnce(error);
  await expect(verifyEmailOtp('person@example.com', '012345')).resolves.toEqual({ status: 'invalid-or-expired' });
  expect(verifyOtp).toHaveBeenCalledTimes(1);
  await expect(verifyEmailOtp('person@example.com', '012345')).resolves.toEqual({ status: 'verified' });
});

test.each(['returned', 'thrown'])('sanitizes %s SDK/network failure and permits retry', async (mode) => {
  const error = { code: 'unexpected_failure', message: 'private details' };
  if (mode === 'returned') verifyOtp.mockResolvedValueOnce({ data: { session: null, user: null }, error });
  else verifyOtp.mockRejectedValueOnce(new Error('private network details'));
  await expect(verifyEmailOtp('person@example.com', '012345')).resolves.toEqual({ status: 'failed', reason: 'verification' });
  expect(verifyOtp).toHaveBeenCalledTimes(1);
  await expect(verifyEmailOtp('person@example.com', '012345')).resolves.toEqual({ status: 'verified' });
});

test.each([
  { session: null, user },
  { session, user: null },
  { session: { ...session, access_token: '' }, user },
  { session: { ...session, refresh_token: '' }, user },
  { session: { ...session, user: { id: 'other-user' } }, user },
  { session, user: { ...user, is_anonymous: true } },
])('never authenticates without a complete matching non-anonymous session/user %#', async (data) => {
  verifyOtp.mockResolvedValueOnce({ data, error: null });
  await expect(verifyEmailOtp('person@example.com', '012345')).resolves.toEqual({ status: 'failed', reason: 'missing-session' });
});

test('handles client configuration failure and permits retry', async () => {
  jest.mocked(getSupabase).mockImplementationOnce(() => { throw new Error('private configuration'); });
  await expect(verifyEmailOtp('person@example.com', '012345')).resolves.toEqual({ status: 'failed', reason: 'configuration' });
  expect(verifyOtp).not.toHaveBeenCalled();
  await expect(verifyEmailOtp('person@example.com', '012345')).resolves.toEqual({ status: 'verified' });
});
