import * as WebBrowser from 'expo-web-browser';
import { getSupabase } from '../../../lib/supabase';
import { APPLE_REDIRECT_URL, signInWithApple } from '../appleSignIn';

jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn() }));
jest.mock('../../../lib/supabase', () => ({ getSupabase: jest.fn() }));
const signInWithOAuth = jest.fn();
const setSession = jest.fn();
const user = { id: 'test-user', is_anonymous: false };
const session = { access_token: 'test-access', refresh_token: 'test-refresh', user };
const callback = 'chunk://login#access_token=test-access&refresh_token=test-refresh';
const success = () => ({ data: { session, user }, error: null });
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(getSupabase).mockReturnValue({ auth: { signInWithOAuth, setSession } } as unknown as ReturnType<typeof getSupabase>);
  signInWithOAuth.mockResolvedValue({ data: { url: 'https://example.supabase.co/auth/v1/authorize' }, error: null });
  jest.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValue({ type: 'success', url: callback } as any);
  setSession.mockResolvedValue(success());
});

test('requests Apple OAuth and establishes the real Supabase session from the callback', async () => {
  await signInWithApple();
  expect(signInWithOAuth).toHaveBeenCalledWith({ provider: 'apple', options: { redirectTo: APPLE_REDIRECT_URL, skipBrowserRedirect: true } });
  expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith('https://example.supabase.co/auth/v1/authorize', 'chunk://login');
  expect(setSession).toHaveBeenCalledWith({ access_token: 'test-access', refresh_token: 'test-refresh' });
});

test.each(['cancel', 'dismiss'])('%s exits without authentication and permits retry', async type => {
  jest.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValueOnce({ type } as any);
  await expect(signInWithApple()).resolves.toBeUndefined();
  expect(setSession).not.toHaveBeenCalled();
  await signInWithApple();
  expect(setSession).toHaveBeenCalledTimes(1);
});

test.each([
  'chunk://other#access_token=a&refresh_token=b',
  'https://login#access_token=a&refresh_token=b',
  'chunk://login/other#access_token=a&refresh_token=b',
  'chunk://login.evil#access_token=a&refresh_token=b',
  'chunk://login#access_token=a',
  'chunk://login#error=access_denied&error_description=private',
  'chunk://login?error=access_denied#access_token=a&refresh_token=b',
  'not-a-url',
])('rejects malformed or failed callbacks without creating a session %#', async url => {
  jest.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValueOnce({ type: 'success', url } as any);
  await expect(signInWithApple()).rejects.toThrow('Apple sign-in could not be completed. Please try again.');
  expect(setSession).not.toHaveBeenCalled();
});

test.each(['configuration', 'oauth', 'browser', 'session'])('sanitizes %s failure and releases duplicate protection', async stage => {
  const privateError = new Error('private-provider-detail');
  if (stage === 'configuration') jest.mocked(getSupabase).mockImplementationOnce(() => { throw privateError; });
  if (stage === 'oauth') signInWithOAuth.mockResolvedValueOnce({ data: { url: null }, error: privateError });
  if (stage === 'browser') jest.mocked(WebBrowser.openAuthSessionAsync).mockRejectedValueOnce(privateError);
  if (stage === 'session') setSession.mockResolvedValueOnce({ ...success(), error: privateError });
  await expect(signInWithApple()).rejects.toThrow('Apple sign-in could not be completed. Please try again.');
  await expect(signInWithApple()).resolves.toBeUndefined();
});

test.each([
  { session: null, user: null },
  { session: { ...session, refresh_token: '' }, user },
  { session, user: { ...user, id: 'different-user' } },
  { session, user: { ...user, is_anonymous: true } },
])('requires a real non-anonymous session and matching user %#', async data => {
  setSession.mockResolvedValueOnce({ data, error: null });
  await expect(signInWithApple()).rejects.toThrow('Apple sign-in could not be completed. Please try again.');
});

test('concurrent taps open only one OAuth browser', async () => {
  let finish!: (result: any) => void;
  jest.mocked(WebBrowser.openAuthSessionAsync).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const first = signInWithApple();
  await Promise.resolve();
  await signInWithApple();
  expect(signInWithOAuth).toHaveBeenCalledTimes(1);
  expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledTimes(1);
  finish({ type: 'success', url: callback });
  await first;
  expect(setSession).toHaveBeenCalledTimes(1);
});
