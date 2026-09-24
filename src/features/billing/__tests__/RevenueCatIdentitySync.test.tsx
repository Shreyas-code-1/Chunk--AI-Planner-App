import React from 'react';
import { useSession } from '../../auth/SessionProvider';
import { identifyCustomer, type IdentifyCustomerResult } from '../identify';
import { RevenueCatIdentitySync } from '../RevenueCatIdentitySync';

const { act, create } = require('react-test-renderer');
jest.mock('../../auth/SessionProvider', () => ({ useSession: jest.fn() }));
jest.mock('../identify', () => ({ identifyCustomer: jest.fn() }));
const a = '8c62a3c1-b70f-498d-b3af-086afcce328b';
const b = '1ca68f9f-c830-443f-b85c-0f2e3a63b52f';
const c = '2ca68f9f-c830-443f-b85c-0f2e3a63b52f';
const signOut = jest.fn();
let tree: any;
function session(id: string | null, loading = false, overrides = {}) {
  jest.mocked(useSession).mockReturnValue({
    session: id ? { access_token: 'test-token', user: { id, email: 'unused@example.com', is_anonymous: false } } : null,
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
  jest.resetAllMocks();
  jest.mocked(identifyCustomer).mockResolvedValue({ status: 'identified', isPro: false });
  session(null);
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  tree = undefined;
  expect(signOut).not.toHaveBeenCalled();
});

test('waits for restoration then identifies using only the restored user ID', async () => {
  session(a, true); await render();
  expect(identifyCustomer).not.toHaveBeenCalled();
  session(a); await render();
  expect(identifyCustomer).toHaveBeenCalledTimes(1);
  expect(identifyCustomer).toHaveBeenCalledWith(a);
});
test('signed-out journey is untouched; later login identifies', async () => {
  await render();
  expect(identifyCustomer).not.toHaveBeenCalled();
  session(a); await render();
  expect(identifyCustomer).toHaveBeenCalledWith(a);
});
test('unchanged ID and refreshed session do not repeat identification', async () => {
  session(a); await render();
  session(a); await render();
  session(a, false, { session: { access_token: 'refreshed-token', user: { id: a } } }); await render();
  expect(identifyCustomer).toHaveBeenCalledTimes(1);
});
test('completed A followed by B identifies B independently', async () => {
  session(a); await render();
  session(b); await render();
  expect(jest.mocked(identifyCustomer).mock.calls).toEqual([[a], [b]]);
});
test('in-flight A completes before B, and obsolete queued sessions are skipped', async () => {
  let finish!: (result: IdentifyCustomerResult) => void;
  jest.mocked(identifyCustomer).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  session(a); await render();
  session(b); await render();
  session(c); await render();
  expect(identifyCustomer).toHaveBeenCalledTimes(1);
  await act(async () => finish({ status: 'identified', isPro: true }));
  expect(jest.mocked(identifyCustomer).mock.calls).toEqual([[a], [c]]);
  expect(tree.toJSON()).toBeNull();
});
test('sign-out while identification is pending does not start another call or publish Pro', async () => {
  let finish!: (result: IdentifyCustomerResult) => void;
  jest.mocked(identifyCustomer).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  session(a); await render();
  session(null); await render();
  await act(async () => finish({ status: 'identified', isPro: true }));
  expect(identifyCustomer).toHaveBeenCalledTimes(1);
  expect(tree.toJSON()).toBeNull();
  session(a); await render();
  expect(identifyCustomer).toHaveBeenCalledTimes(2);
});
test.each(['result', 'rejection'])('failure (%s) preserves session and allows the next account to synchronize', async kind => {
  if (kind === 'result') jest.mocked(identifyCustomer).mockResolvedValueOnce({ status: 'failed', reason: 'login' });
  else jest.mocked(identifyCustomer).mockRejectedValueOnce(new Error('private details'));
  session(a); await render();
  expect(useSession().session?.user.id).toBe(a);
  session(a); await render();
  expect(identifyCustomer).toHaveBeenCalledTimes(1);
  session(b); await render();
  expect(identifyCustomer).toHaveBeenLastCalledWith(b);
  expect(tree.toJSON()).toBeNull();
});
test('anonymous Supabase session or missing configuration does not identify', async () => {
  session(a, false, { session: { access_token: 'test', user: { id: a, is_anonymous: true } } });
  await render();
  session(a, false, { configError: 'Not configured' }); await render();
  expect(identifyCustomer).not.toHaveBeenCalled();
});
test('unmount cancels queued work while a remount waits for the existing call', async () => {
  let finish!: (result: IdentifyCustomerResult) => void;
  jest.mocked(identifyCustomer).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  session(a); await render();
  session(b); await render();
  await act(async () => tree.unmount()); tree = undefined;
  session(c); await render();
  expect(identifyCustomer).toHaveBeenCalledTimes(1);
  await act(async () => finish({ status: 'identified', isPro: false }));
  expect(jest.mocked(identifyCustomer).mock.calls).toEqual([[a], [c]]);
});
