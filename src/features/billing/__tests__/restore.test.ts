import { identityCoordinator } from '../identityCoordinator';
import Purchases, { type CustomerInfo } from 'react-native-purchases';

import { initializeRevenueCat } from '../initialize';
import { restorePurchases } from '../restore';

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { isAnonymous: jest.fn(), logIn: jest.fn(), logOut: jest.fn(), restorePurchases: jest.fn() },
}));
jest.mock('../initialize', () => ({ initializeRevenueCat: jest.fn() }));

function customerInfo(active: Record<string, { isActive: boolean }> = { chunk_pro: { isActive: true } }) {
  return { entitlements: { active } } as unknown as CustomerInfo;
}

beforeEach(async () => {
  identityCoordinator.setDesiredIdentity({ kind: 'unresolved' });
  jest.resetAllMocks();
  jest.mocked(Purchases.isAnonymous).mockResolvedValue(true);
  jest.mocked(Purchases.logIn).mockResolvedValue({ created: false, customerInfo: customerInfo() });
  jest.mocked(initializeRevenueCat).mockResolvedValue(undefined);
  jest.mocked(Purchases.restorePurchases).mockResolvedValue(customerInfo());
  identityCoordinator.setDesiredIdentity({ kind: 'anonymous' });
  await identityCoordinator.whenIdle();
});
test('returns restored only for active Chunk Pro in the returned CustomerInfo', async () => {
  await expect(restorePurchases()).resolves.toEqual({ status: 'restored' });
  expect(Purchases.restorePurchases).toHaveBeenCalledTimes(1);
  expect(Purchases.restorePurchases).toHaveBeenCalledWith();
});

test.each<Record<string, { isActive: boolean }>>([
  {}, { unrelated: { isActive: true } }, { chunk_pro: { isActive: false } },
])('completed restore without active Chunk Pro is not a Pro success: %j', async (active) => {
  jest.mocked(Purchases.restorePurchases).mockResolvedValue(customerInfo(active));
  await expect(restorePurchases()).resolves.toEqual({ status: 'entitlement-inactive' });
});

test.each([new Error('private details'), null, { code: '2', userInfo: 'private' }])(
  'SDK rejection returns a sanitized failure and permits retry %#', async (error) => {
    jest.mocked(Purchases.restorePurchases).mockRejectedValueOnce(error);
    await expect(restorePurchases()).resolves.toEqual({ status: 'failed', reason: 'restore' });
    await expect(restorePurchases()).resolves.toEqual({ status: 'restored' });
    expect(Purchases.restorePurchases).toHaveBeenCalledTimes(2);
  },
);

test('initialization failure prevents restoration and permits retry', async () => {
  jest.mocked(initializeRevenueCat).mockRejectedValueOnce(new Error('unavailable'));
  await expect(restorePurchases()).resolves.toEqual({ status: 'failed', reason: 'initialization' });
  expect(Purchases.restorePurchases).not.toHaveBeenCalled();
  await expect(restorePurchases()).resolves.toEqual({ status: 'restored' });
});

test('blocks duplicate restores while initialization is pending', async () => {
  let ready!: () => void;
  jest.mocked(initializeRevenueCat).mockReturnValueOnce(new Promise<void>((resolve) => { ready = resolve; }));
  const first = restorePurchases();
  await expect(restorePurchases()).resolves.toEqual({ status: 'failed', reason: 'in-progress' });
  expect(Purchases.restorePurchases).not.toHaveBeenCalled();
  ready();
  await expect(first).resolves.toEqual({ status: 'restored' });
  expect(Purchases.restorePurchases).toHaveBeenCalledTimes(1);
});

test('blocks duplicates during restoration and releases the reservation after completion', async () => {
  let finish!: (info: CustomerInfo) => void;
  jest.mocked(Purchases.restorePurchases).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
  const first = restorePurchases();
  await Promise.resolve();
  expect(Purchases.restorePurchases).toHaveBeenCalledTimes(1);
  await expect(restorePurchases()).resolves.toEqual({ status: 'failed', reason: 'in-progress' });
  finish(customerInfo({}));
  await expect(first).resolves.toEqual({ status: 'entitlement-inactive' });
  await expect(restorePurchases()).resolves.toEqual({ status: 'restored' });
  expect(Purchases.restorePurchases).toHaveBeenCalledTimes(2);
});

test('the original billing export uses the implemented restore operation', () => {
  expect(require('../usePro').restorePurchases).toBe(restorePurchases);
});

test.each(['unresolved', 'transitioning', 'failed'] as const)('blocks %s identity without SDK transaction', async state => {
  if (state === 'unresolved') identityCoordinator.setDesiredIdentity({ kind: 'unresolved' });
  if (state === 'failed') identityCoordinator.setDesiredIdentity({ kind: 'identified', userId: 'invalid' });
  if (state === 'transitioning') identityCoordinator.setDesiredIdentity({ kind: 'identified', userId: userId });
  await expect(restorePurchases()).resolves.toEqual({ status: 'failed', reason: 'identity-not-ready' });
  expect(Purchases.restorePurchases).not.toHaveBeenCalled();
  await identityCoordinator.whenIdle();
});

const userId = '8c62a3c1-b70f-498d-b3af-086afcce328b';
test('reservation delays identity SDK work and suppresses stale transaction success', async () => {
  let finish!: (value: CustomerInfo) => void;
  jest.mocked(Purchases.restorePurchases).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const transaction = restorePurchases();
  await Promise.resolve();
  expect(Purchases.restorePurchases).toHaveBeenCalledTimes(1);
  const generation = identityCoordinator.getSnapshot().generation;
  identityCoordinator.setDesiredIdentity({ kind: 'identified', userId });
  expect(identityCoordinator.getSnapshot().generation).toBeGreaterThan(generation);
  await identityCoordinator.whenIdle();
  expect(Purchases.logIn).not.toHaveBeenCalled();
  finish(customerInfo());
  await expect(transaction).resolves.toEqual({ status: 'failed', reason: 'identity-changed' });
  await identityCoordinator.whenIdle();
  expect(Purchases.logIn).toHaveBeenCalledWith(userId);
});

test('identity change during initialization prevents starting the SDK transaction', async () => {
  let finish!: () => void;
  jest.mocked(initializeRevenueCat).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const transaction = restorePurchases();
  identityCoordinator.setDesiredIdentity({ kind: 'unresolved' });
  finish();
  await expect(transaction).resolves.toEqual({ status: 'failed', reason: 'identity-changed' });
  expect(Purchases.restorePurchases).not.toHaveBeenCalled();
  identityCoordinator.setDesiredIdentity({ kind: 'anonymous' });
  await identityCoordinator.whenIdle();
  await expect(restorePurchases()).resolves.toEqual({ status: 'restored' });
});
