import React from 'react';
import Purchases, { type CustomerInfo, type LogInResult } from 'react-native-purchases';
import { useSession } from '../../auth/SessionProvider';
import { initializeRevenueCat } from '../initialize';
import { identityCoordinator } from '../identityCoordinator';
import { RevenueCatIdentitySync } from '../RevenueCatIdentitySync';
const { act, create } = require('react-test-renderer');
jest.mock('../../auth/SessionProvider', () => ({ useSession: jest.fn() }));
jest.mock('../initialize', () => ({ initializeRevenueCat: jest.fn() }));
jest.mock('react-native-purchases', () => ({ __esModule: true,
  default: { logIn: jest.fn(), logOut: jest.fn(), isAnonymous: jest.fn() } }));
const a = '8c62a3c1-b70f-498d-b3af-086afcce328b';
const b = '1ca68f9f-c830-443f-b85c-0f2e3a63b52f';
const c = '2ca68f9f-c830-443f-b85c-0f2e3a63b52f';
const signOut = jest.fn();
const result = (pro = false): LogInResult => ({ created: true,
  customerInfo: { entitlements: { active: pro ? { chunk_pro: { isActive: true } } : {} } } as unknown as CustomerInfo });
let tree: any;
function session(id: string | null, loading = false, overrides = {}) {
  jest.mocked(useSession).mockReturnValue({
    session: id ? { access_token: 'test', user: { id, email: 'unused@example.com', is_anonymous: false } } : null,
    loading, configError: null, signOut, ...overrides,
  } as unknown as ReturnType<typeof useSession>);
}
async function render() {
  await act(async () => {
    if (tree) tree.update(<RevenueCatIdentitySync />);
    else tree = create(<RevenueCatIdentitySync />);
  });
}
beforeEach(() => {
  identityCoordinator.setDesiredIdentity({ kind: 'unresolved' });
  jest.resetAllMocks();
  jest.mocked(initializeRevenueCat).mockResolvedValue(undefined);
  jest.mocked(Purchases.logIn).mockResolvedValue(result());
  session(null);
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  tree = undefined;
  await identityCoordinator.whenIdle();
  expect(signOut).not.toHaveBeenCalled();
  expect(Purchases.logOut).not.toHaveBeenCalled();
  expect(Purchases.isAnonymous).not.toHaveBeenCalled();
});
test('restoration pending stays unresolved then identifies only the restored UUID', async () => {
  session(a, true); await render();
  expect(identityCoordinator.getSnapshot().status).toBe('unresolved');
  expect(Purchases.logIn).not.toHaveBeenCalled();
  session(a); await render();
  expect(Purchases.logIn).toHaveBeenCalledWith(a);
  expect(identityCoordinator.getSnapshot().status).toBe('ready');
});
test('signed-out startup preserves SDK customer; later login identifies', async () => {
  await render();
  expect(initializeRevenueCat).not.toHaveBeenCalled();
  session(a); await render();
  expect(Purchases.logIn).toHaveBeenCalledTimes(1);
});
test('same-user and token refresh do not repeat identification or change generation', async () => {
  session(a); await render();
  const generation = identityCoordinator.getSnapshot().generation;
  session(a); await render();
  session(a, false, { session: { access_token: 'refreshed', user: { id: a } } }); await render();
  expect(Purchases.logIn).toHaveBeenCalledTimes(1);
  expect(identityCoordinator.getSnapshot().generation).toBe(generation);
});
test('A to B replaces account and Pro state', async () => {
  jest.mocked(Purchases.logIn).mockResolvedValueOnce(result(true));
  session(a); await render();
  session(b); await render();
  expect(jest.mocked(Purchases.logIn).mock.calls).toEqual([[a], [b]]);
  expect(identityCoordinator.getSnapshot()).toMatchObject({ status: 'ready', isPro: false });
});
test('in-flight A is superseded immediately and obsolete B is skipped', async () => {
  let finish!: (value: LogInResult) => void;
  jest.mocked(Purchases.logIn).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  session(a); await render();
  const generation = identityCoordinator.getSnapshot().generation;
  const waiting = identityCoordinator.waitForGeneration(generation);
  session(b); await render();
  session(c); await render();
  await expect(waiting).resolves.toEqual({ status: 'superseded', generation });
  expect(identityCoordinator.getSnapshot()).toMatchObject({ status: 'transitioning', isPro: null });
  expect(Purchases.logIn).toHaveBeenCalledTimes(1);
  await act(async () => { finish(result(true)); await identityCoordinator.whenIdle(); });
  expect(jest.mocked(Purchases.logIn).mock.calls).toEqual([[a], [c]]);
  expect(identityCoordinator.getSnapshot().isPro).toBe(false);
});
test('sign-out invalidates pending results without logout', async () => {
  let finish!: (value: LogInResult) => void;
  jest.mocked(Purchases.logIn).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  session(a); await render();
  session(null); await render();
  await act(async () => { finish(result(true)); await identityCoordinator.whenIdle(); });
  expect(identityCoordinator.getSnapshot()).toMatchObject({ status: 'unresolved', isPro: null });
  expect(Purchases.logIn).toHaveBeenCalledTimes(1);
});
test('failure preserves Supabase session and does not retry on unchanged-user events', async () => {
  jest.mocked(Purchases.logIn).mockRejectedValueOnce(new Error('private details'));
  session(a); await render();
  expect(useSession().session?.user.id).toBe(a);
  expect(identityCoordinator.getSnapshot()).toMatchObject({ status: 'failed', isPro: null });
  session(a); await render();
  expect(Purchases.logIn).toHaveBeenCalledTimes(1);
  session(b); await render();
  expect(identityCoordinator.getSnapshot().status).toBe('ready');
});
test('configuration error and anonymous Supabase session stay unresolved', async () => {
  session(a, false, { configError: 'Not configured' }); await render();
  session(a, false, { session: { access_token: 'test', user: { id: a, is_anonymous: true } } }); await render();
  expect(identityCoordinator.getSnapshot().status).toBe('unresolved');
  expect(Purchases.logIn).not.toHaveBeenCalled();
});
test('returning to loading clears ready account state', async () => {
  session(a); await render();
  session(a, true); await render();
  expect(identityCoordinator.getSnapshot()).toMatchObject({ status: 'unresolved', isPro: null });
});
test('unmount invalidates pending completion', async () => {
  let finish!: (value: LogInResult) => void;
  jest.mocked(Purchases.logIn).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  session(a); await render();
  await act(async () => tree.unmount()); tree = undefined;
  finish(result(true)); await identityCoordinator.whenIdle();
  expect(identityCoordinator.getSnapshot()).toMatchObject({ status: 'unresolved', isPro: null });
});
