import { getSupabase } from '../../../lib/supabase';
import { requestEmailOtp } from '../requestEmailOtp';

jest.mock('../../../lib/supabase', () => ({ getSupabase: jest.fn() }));

const signInWithOtp = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(getSupabase).mockReturnValue({
    auth: { signInWithOtp },
  } as unknown as ReturnType<typeof getSupabase>);
  signInWithOtp.mockResolvedValue({ data: { user: null, session: null }, error: null });
});

test('requests an OTP with trimmed input without altering the email local part', async () => {
  await expect(requestEmailOtp('  Person+Chunk@example.com \n')).resolves.toEqual({ status: 'requested' });
  expect(signInWithOtp).toHaveBeenCalledWith({
    email: 'Person+Chunk@example.com', options: { shouldCreateUser: true },
  });
  expect(signInWithOtp).toHaveBeenCalledTimes(1);
});

test.each(['', '   ', 'person', 'person@', '@example.com', 'person@example', 'per son@example.com', 'person@@example.com'])(
  'rejects malformed input before accessing Supabase: %j', async (email) => {
    await expect(requestEmailOtp(email)).resolves.toEqual({ status: 'failed', reason: 'invalid-email' });
    expect(getSupabase).not.toHaveBeenCalled();
    expect(signInWithOtp).not.toHaveBeenCalled();
  },
);

test('sanitizes returned Supabase errors and allows an explicit retry', async () => {
  signInWithOtp.mockResolvedValueOnce({ data: { user: null, session: null }, error: new Error('internal details') });
  await expect(requestEmailOtp('person@example.com')).resolves.toEqual({ status: 'failed', reason: 'request' });
  expect(signInWithOtp).toHaveBeenCalledTimes(1);
  await expect(requestEmailOtp('person@example.com')).resolves.toEqual({ status: 'requested' });
  expect(signInWithOtp).toHaveBeenCalledTimes(2);
});

test('sanitizes rejected requests and allows an explicit retry', async () => {
  signInWithOtp.mockRejectedValueOnce(new Error('internal details'));
  await expect(requestEmailOtp('person@example.com')).resolves.toEqual({ status: 'failed', reason: 'request' });
  expect(signInWithOtp).toHaveBeenCalledTimes(1);
  await expect(requestEmailOtp('person@example.com')).resolves.toEqual({ status: 'requested' });
});

test('sanitizes client configuration failures and allows retry', async () => {
  jest.mocked(getSupabase).mockImplementationOnce(() => { throw new Error('configuration details'); });
  await expect(requestEmailOtp('person@example.com')).resolves.toEqual({ status: 'failed', reason: 'configuration' });
  expect(signInWithOtp).not.toHaveBeenCalled();
  await expect(requestEmailOtp('person@example.com')).resolves.toEqual({ status: 'requested' });
});

test('permits an explicit resend after an accepted request', async () => {
  await expect(requestEmailOtp('person@example.com')).resolves.toEqual({ status: 'requested' });
  await expect(requestEmailOtp('person@example.com')).resolves.toEqual({ status: 'requested' });
  expect(signInWithOtp).toHaveBeenCalledTimes(2);
});
