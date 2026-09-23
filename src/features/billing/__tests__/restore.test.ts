import Purchases, { type CustomerInfo } from 'react-native-purchases';

import { initializeRevenueCat } from '../initialize';
import { restorePurchases } from '../restore';

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { restorePurchases: jest.fn() },
}));
jest.mock('../initialize', () => ({ initializeRevenueCat: jest.fn() }));

function customerInfo(active: Record<string, { isActive: boolean }> = { chunk_pro: { isActive: true } }) {
  return { entitlements: { active } } as unknown as CustomerInfo;
}

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(initializeRevenueCat).mockResolvedValue(undefined);
  jest.mocked(Purchases.restorePurchases).mockResolvedValue(customerInfo());
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

test('blocks duplicates during restoration and releases the lock after completion', async () => {
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
