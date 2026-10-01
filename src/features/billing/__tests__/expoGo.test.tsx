/**
 * In Expo Go, RevenueCat's native module must never load, the paywall still
 * gets offerings to render, and provider sign-in is hidden (email remains).
 */
import React from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';

jest.mock('react-native-purchases', () => {
  throw new Error('react-native-purchases was loaded in Expo Go');
});
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }) }));
jest.mock('../../auth/SessionProvider', () => ({
  useSession: () => ({ status: 'signed-out', session: null, signInWithGoogle: jest.fn(), signInWithApple: jest.fn() }),
}));
jest.mock('../../../lib/haptics', () => ({ haptic: jest.fn() }));

const { act, create } = require('react-test-renderer');

beforeEach(() => {
  Constants.executionEnvironment = ExecutionEnvironment.StoreClient;
});

test('billing reports unavailable without loading the native module', async () => {
  const { isBillingAvailable } = require('../availability');
  const { purchasePlan } = require('../purchase');
  const { restorePurchases } = require('../restore');
  const { initializeRevenueCat } = require('../initialize');
  expect(isBillingAvailable()).toBe(false);
  await expect(purchasePlan({} as never)).resolves.toEqual({ status: 'failed', reason: 'unavailable' });
  await expect(restorePurchases()).resolves.toEqual({ status: 'failed', reason: 'unavailable' });
  await expect(initializeRevenueCat()).rejects.toThrow('Expo Go');
});

test('the paywall gets sample offerings at the board prices', async () => {
  const { fetchChunkOffering } = require('../offerings');
  const { getPaywallPlans } = require('../paywallPlans');
  const plans = getPaywallPlans(await fetchChunkOffering());
  expect(plans?.yearly.priceLabel).toBe('$7.99 / MO');
  expect(plans?.yearly.detail).toBe('$95.88 billed yearly');
  expect(plans?.monthly.priceLabel).toBe('$10.99 / MO');
});

test('login hides Apple and Google in Expo Go but keeps email', () => {
  const Login = require('../../../app/(onboarding)/login').default;
  let tree: any;
  act(() => { tree = create(<Login />); });
  const text = JSON.stringify(tree.toJSON());
  expect(text).not.toContain('CONTINUE WITH GOOGLE');
  expect(text).not.toContain('CONTINUE WITH APPLE');
  expect(text).toMatch(/EMAIL/);
  act(() => tree.unmount());
});
