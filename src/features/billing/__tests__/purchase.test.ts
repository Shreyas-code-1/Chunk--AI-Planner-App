import { restorePurchases } from '../restore';
import { identityCoordinator } from '../identityCoordinator';
import Purchases, { type MakePurchaseResult, type PurchasesPackage } from 'react-native-purchases';

import { initializeRevenueCat } from '../initialize';
import { purchasePlan } from '../purchase';

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { isAnonymous: jest.fn(), logIn: jest.fn(), logOut: jest.fn(),
    purchasePackage: jest.fn(), restorePurchases: jest.fn(),
    PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: '1' },
  },
}));
jest.mock('../initialize', () => ({ initializeRevenueCat: jest.fn() }));

const monthly = { identifier: '$rc_monthly' } as PurchasesPackage;
const annual = { identifier: '$rc_annual' } as PurchasesPackage;
function receipt(active: Record<string, { isActive: boolean }> = { chunk_pro: { isActive: true } }) {
  return { customerInfo: { entitlements: { active } } } as unknown as MakePurchaseResult;
}

beforeEach(async () => {
  identityCoordinator.setDesiredIdentity({ kind: 'unresolved' });
  jest.resetAllMocks();
  jest.mocked(Purchases.isAnonymous).mockResolvedValue(true);
  jest.mocked(Purchases.logIn).mockResolvedValue({ created: false, customerInfo: receipt().customerInfo });
  jest.mocked(initializeRevenueCat).mockResolvedValue(undefined);
  jest.mocked(Purchases.purchasePackage).mockResolvedValue(receipt());
  identityCoordinator.setDesiredIdentity({ kind: 'anonymous' });
  await identityCoordinator.whenIdle();
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

test('initialization failure prevents purchasing and releases the reservation', async () => {
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

test('blocks calls during the purchase and releases the reservation after completion', async () => {
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

test.each([{ code: '1' }, new Error('failure')])('releases the reservation after cancellation or rejection %#', async (error) => {
  jest.mocked(Purchases.purchasePackage).mockRejectedValueOnce(error);
  await purchasePlan(monthly);
  await expect(purchasePlan(annual)).resolves.toEqual({ status: 'purchased' });
});

test.each(['unresolved', 'transitioning', 'failed'] as const)('blocks %s identity without SDK transaction', async state => {
  if (state === 'unresolved') identityCoordinator.setDesiredIdentity({ kind: 'unresolved' });
  if (state === 'failed') identityCoordinator.setDesiredIdentity({ kind: 'identified', userId: 'invalid' });
  if (state === 'transitioning') identityCoordinator.setDesiredIdentity({ kind: 'identified', userId: userId });
  await expect(purchasePlan(monthly)).resolves.toEqual({ status: 'failed', reason: 'identity-not-ready' });
  expect(Purchases.purchasePackage).not.toHaveBeenCalled();
  await identityCoordinator.whenIdle();
});

const userId = '8c62a3c1-b70f-498d-b3af-086afcce328b';
test('reservation delays identity SDK work and suppresses stale transaction success', async () => {
  let finish!: (value: MakePurchaseResult) => void;
  jest.mocked(Purchases.purchasePackage).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const transaction = purchasePlan(monthly);
  await Promise.resolve();
  expect(Purchases.purchasePackage).toHaveBeenCalledTimes(1);
  const generation = identityCoordinator.getSnapshot().generation;
  identityCoordinator.setDesiredIdentity({ kind: 'identified', userId });
  expect(identityCoordinator.getSnapshot().generation).toBeGreaterThan(generation);
  await identityCoordinator.whenIdle();
  expect(Purchases.logIn).not.toHaveBeenCalled();
  finish(receipt());
  await expect(transaction).resolves.toEqual({ status: 'failed', reason: 'identity-changed' });
  await identityCoordinator.whenIdle();
  expect(Purchases.logIn).toHaveBeenCalledWith(userId);
});

test('identity change during initialization prevents starting the SDK transaction', async () => {
  let finish!: () => void;
  jest.mocked(initializeRevenueCat).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  const transaction = purchasePlan(monthly);
  identityCoordinator.setDesiredIdentity({ kind: 'unresolved' });
  finish();
  await expect(transaction).resolves.toEqual({ status: 'failed', reason: 'identity-changed' });
  expect(Purchases.purchasePackage).not.toHaveBeenCalled();
  identityCoordinator.setDesiredIdentity({ kind: 'anonymous' });
  await identityCoordinator.whenIdle();
  await expect(purchasePlan(monthly)).resolves.toEqual({ status: 'purchased' });
});

test.each(['purchase', 'restore'])('%s reservation excludes the other transaction', async firstKind => {
  let finish!: () => void;
  if (firstKind === 'purchase') {
    jest.mocked(Purchases.purchasePackage).mockReturnValueOnce(new Promise(resolve => { finish = () => resolve(receipt()); }));
  } else {
    jest.mocked(Purchases.restorePurchases).mockReturnValueOnce(new Promise(resolve => { finish = () => resolve(receipt().customerInfo); }));
  }
  const first = firstKind === 'purchase' ? purchasePlan(monthly) : restorePurchases();
  await Promise.resolve();
  const blocked = firstKind === 'purchase' ? restorePurchases() : purchasePlan(monthly);
  await expect(blocked).resolves.toEqual({ status: 'failed', reason: 'in-progress' });
  expect(firstKind === 'purchase' ? Purchases.restorePurchases : Purchases.purchasePackage).not.toHaveBeenCalled();
  finish();
  await first;
  const reservation = identityCoordinator.tryReserve();
  expect(reservation).not.toBeNull();
  reservation?.release();
});
