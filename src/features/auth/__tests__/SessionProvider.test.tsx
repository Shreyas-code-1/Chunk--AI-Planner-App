import React from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { SessionProvider, useSession } from '../SessionProvider';
import { getSupabase, isSupabaseConfigured } from '../../../lib/supabase';
import { signInWithGoogle } from '../googleSignIn';
import { signInWithApple } from '../appleSignIn';
jest.mock('../appleSignIn', () => ({ signInWithApple: jest.fn() }));
jest.mock('../googleSignIn', () => ({ signInWithGoogle: jest.fn() }));
const { act, create } = require('react-test-renderer');
jest.mock('../../../lib/supabase', () => ({ getSupabase: jest.fn(), isSupabaseConfigured: jest.fn() }));
const getSession = jest.fn();
const signOut = jest.fn();
const unsubscribe = jest.fn();
let event: (name: AuthChangeEvent, session: Session | null) => void;
let finish: (value: any) => void;
let reject: (error: unknown) => void;
let latest: ReturnType<typeof useSession>;
let tree: any;
const user = { access_token: 'test-access', refresh_token: 'test-refresh', user: { id: 'test-user', is_anonymous: false } } as Session;
function Probe() { latest = useSession(); return null; }
async function mount() { await act(async () => { tree = create(<SessionProvider><Probe /></SessionProvider>); }); }
async function emit(name: AuthChangeEvent, value: Session | null) { await act(async () => event(name, value)); }
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(isSupabaseConfigured).mockReturnValue(true);
  getSession.mockReturnValue(new Promise((yes, no) => { finish = yes; reject = no; }));
  signOut.mockResolvedValue({ error: null });
  jest.mocked(getSupabase).mockReturnValue({ auth: { getSession, signOut,
    onAuthStateChange: (callback: typeof event) => { event = callback; return { data: { subscription: { unsubscribe } } }; },
  } } as unknown as ReturnType<typeof getSupabase>);
});
afterEach(() => { if (tree) act(() => tree.unmount()); tree = undefined; });
test('initial restoration is unresolved and loading', async () => {
  await mount(); expect(latest).toMatchObject({ session: null, status: 'unresolved', loading: true, configError: null });
});

test('Google delegates to OAuth and receives its session through the existing auth listener', async () => {
  await mount();
  jest.mocked(signInWithGoogle).mockImplementation(async () => { event('SIGNED_IN', user); });
  await act(async () => latest.signInWithGoogle());
  expect(signInWithGoogle).toHaveBeenCalledTimes(1);
  expect(latest).toMatchObject({ status: 'authenticated', session: user });
});
test('valid restoration authenticates', async () => {
  await mount(); await act(async () => finish({ data: { session: user }, error: null }));
  expect(latest).toMatchObject({ session: user, status: 'authenticated', loading: false });
});

test('Apple delegates to OAuth and receives its session through the existing auth listener', async () => {
  await mount();
  jest.mocked(signInWithApple).mockImplementation(async () => { event('SIGNED_IN', user); });
  await act(async () => latest.signInWithApple());
  expect(signInWithApple).toHaveBeenCalledTimes(1);
  expect(latest).toMatchObject({ status: 'authenticated', session: user });
});
test('error-free empty restoration confirms signed out', async () => {
  await mount(); await act(async () => finish({ data: { session: null }, error: null }));
  expect(latest).toMatchObject({ session: null, status: 'signed-out', loading: false });
});
test.each(['returned', 'rejected', 'thrown'])('restoration %s error never confirms sign-out', async mode => {
  if (mode === 'thrown') getSession.mockImplementationOnce(() => { throw new Error('private'); });
  await mount();
  if (mode === 'returned') await act(async () => finish({ data: { session: null }, error: new Error('private') }));
  if (mode === 'rejected') await act(async () => reject(new Error('private')));
  expect(latest).toMatchObject({ session: null, status: 'error', loading: false });
});
test.each(['missing', 'invalid'])('%s configuration is error not signed out', async mode => {
  if (mode === 'missing') jest.mocked(isSupabaseConfigured).mockReturnValue(false);
  else jest.mocked(getSupabase).mockImplementation(() => { throw new Error('private config'); });
  await mount(); expect(latest.status).toBe('error'); expect(latest.loading).toBe(false);
  expect(latest.configError).toBeTruthy(); expect(latest.configError).not.toContain('private');
  expect(getSession).not.toHaveBeenCalled();
});
test('authenticated event wins over late empty restoration', async () => {
  await mount(); await emit('SIGNED_IN', user);
  await act(async () => finish({ data: { session: null }, error: null }));
  expect(latest).toMatchObject({ session: user, status: 'authenticated', loading: false });
});
test('signed-out event wins over late authenticated restoration', async () => {
  await mount(); await emit('SIGNED_OUT', null);
  await act(async () => finish({ data: { session: user }, error: null }));
  expect(latest).toMatchObject({ session: null, status: 'signed-out', loading: false });
});
test('late restoration rejection cannot overwrite authenticated event', async () => {
  await mount(); await emit('SIGNED_IN', user); await act(async () => reject(new Error('private')));
  expect(latest.status).toBe('authenticated');
});
test('empty INITIAL_SESSION does not mask restoration error', async () => {
  await mount(); await emit('INITIAL_SESSION', null);
  expect(latest.status).toBe('unresolved');
  await act(async () => finish({ data: { session: null }, error: new Error('private') }));
  expect(latest.status).toBe('error');
});
test('token refresh and subsequent signed-out event update consistently', async () => {
  await mount(); await act(async () => finish({ data: { session: user }, error: null }));
  const refreshed = { ...user, access_token: 'refreshed' };
  await emit('TOKEN_REFRESHED', refreshed); expect(latest.session).toBe(refreshed);
  await emit('SIGNED_OUT', null); expect(latest).toMatchObject({ session: null, status: 'signed-out', loading: false });
});
test.each([{} as Session, { ...user, user: { ...user.user, is_anonymous: true } }])('invalid/anonymous session never confirms signed out %#', async value => {
  await mount(); await act(async () => finish({ data: { session: value }, error: null }));
  expect(latest).toMatchObject({ session: null, status: 'error', loading: false });
});
test('signOut calls Supabase without manufacturing a signed-out event', async () => {
  await mount(); await emit('SIGNED_IN', user);
  await act(async () => latest.signOut()); expect(signOut).toHaveBeenCalledTimes(1);
  expect(latest.status).toBe('authenticated');
  await emit('SIGNED_OUT', null); expect(latest.status).toBe('signed-out');
});
test('signOut preserves returned error behavior', async () => {
  const error = new Error('test signout failure'); signOut.mockResolvedValueOnce({ error });
  await mount(); await emit('SIGNED_IN', user);
  await expect(latest.signOut()).rejects.toBe(error); expect(latest.status).toBe('authenticated');
});
test('unmount unsubscribes and ignores late restoration', async () => {
  await mount(); const previous = latest;
  act(() => tree.unmount()); tree = undefined;
  await act(async () => finish({ data: { session: user }, error: null }));
  expect(unsubscribe).toHaveBeenCalledTimes(1); expect(latest).toBe(previous);
});
