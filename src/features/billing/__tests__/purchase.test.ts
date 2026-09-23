import Purchases, { type MakePurchaseResult, type PurchasesPackage } from 'react-native-purchases';

import { initializeRevenueCat } from '../initialize';
import { purchasePlan } from '../purchase';

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    purchasePackage: jest.fn(),
    PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: '1' },
  },
}));
jest.mock('../initialize', () => ({ initializeRevenueCat: jest.fn() }));

const monthly = { identifier: '$rc_monthly' } as PurchasesPackage;
const annual = { identifier: '$rc_annual' } as PurchasesPackage;
function receipt(active: Record<string, { isActive: boolean }> = { chunk_pro: { isActive: true } }) {
  return { customerInfo: { entitlements: { active } } } as unknown as MakePurchaseResult;
}

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(initializeRevenueCat).mockResolvedValue(undefined);
  jest.mocked(Purchases.purchasePackage).mockResolvedValue(receipt());
});

test('passes the actual package unchanged and reports active Chunk Pro', async () => {
  await expect(purchasePlan(monthly)).resolves.toEqual({ status: 'purchased' });
  expect(Purchases.purchasePackage).toHaveBeenCalledWith(monthly);
  expect(jest.mocked(Purchases.purchasePackage).mock.calls[0][0]).toBe(monthly);
});

test.each<Record<string, { isActive: boolean }>>([{}, { unrelated: { isActive: true } }, { chunk_pro: { isActive: false } }])(
  'a completed transaction without active Chunk Pro is not reported as Pro success: %j',
  async (active) => {
    jest.mocked(Purchases.purchasePackage).mockResolvedValue(receipt(active));
    await expect(purchasePlan(annual)).resolves.toEqual({ status: 'entitlement-inactive' });
  },
);

test('recognizes cancellation using the installed SDK error code without the deprecated flag', async () => {
  jest.mocked(Purchases.purchasePackage).mockRejectedValue({ code: '1' });
  await expect(purchasePlan(monthly)).resolves.toEqual({ status: 'cancelled' });
});

test.each([new Error('private customer details'), null, { code: '2', userInfo: 'private' }])(
  'returns a sanitized failure for SDK rejection %#', async (error) => {
    jest.mocked(Purchases.purchasePackage).mockRejectedValue(error);
    await expect(purchasePlan(monthly)).resolves.toEqual({ status: 'failed', reason: 'purchase' });
  },
);

test('initialization failure prevents purchasing and releases the lock', async () => {
  jest.mocked(initializeRevenueCat).mockRejectedValueOnce(new Error('unavailable'));
  await expect(purchasePlan(monthly)).resolves.toEqual({ status: 'failed', reason: 'initialization' });
  expect(Purchases.purchasePackage).not.toHaveBeenCalled();
  await expect(purchasePlan(monthly)).resolves.toEqual({ status: 'purchased' });
});

test('blocks duplicate calls and other packages while initialization is pending', async () => {
  let ready!: () => void;
  jest.mocked(initializeRevenueCat).mockReturnValueOnce(new Promise<void>((resolve) => { ready = resolve; }));
  const first = purchasePlan(monthly);
  await expect(purchasePlan(monthly)).resolves.toEqual({ status: 'failed', reason: 'in-progress' });
  await expect(purchasePlan(annual)).resolves.toEqual({ status: 'failed', reason: 'in-progress' });
  expect(Purchases.purchasePackage).not.toHaveBeenCalled();
  ready();
  await expect(first).resolves.toEqual({ status: 'purchased' });
  expect(Purchases.purchasePackage).toHaveBeenCalledTimes(1);
});

test('blocks calls during the purchase and releases the lock after completion', async () => {
  let finish!: (value: MakePurchaseResult) => void;
  jest.mocked(Purchases.purchasePackage).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
  const first = purchasePlan(monthly);
  await Promise.resolve();
  expect(Purchases.purchasePackage).toHaveBeenCalledTimes(1);
  await expect(purchasePlan(annual)).resolves.toEqual({ status: 'failed', reason: 'in-progress' });
  finish(receipt());
  await first;
  await expect(purchasePlan(annual)).resolves.toEqual({ status: 'purchased' });
  expect(Purchases.purchasePackage).toHaveBeenCalledTimes(2);
});

test.each([{ code: '1' }, new Error('failure')])('releases the lock after cancellation or rejection %#', async (error) => {
  jest.mocked(Purchases.purchasePackage).mockRejectedValueOnce(error);
  await purchasePlan(monthly);
  await expect(purchasePlan(annual)).resolves.toEqual({ status: 'purchased' });
});
