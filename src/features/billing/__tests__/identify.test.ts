import Purchases, { type CustomerInfo, type LogInResult } from 'react-native-purchases';
import { identifyCustomer } from '../identify';
import { initializeRevenueCat } from '../initialize';
import { identityCoordinator } from '../identityCoordinator';

jest.mock('react-native-purchases', () => ({
  __esModule: true, default: { logIn: jest.fn(), logOut: jest.fn() },
}));
jest.mock('../initialize', () => ({ initializeRevenueCat: jest.fn() }));
const userId = '8c62a3c1-b70f-498d-b3af-086afcce328b';
const otherId = '1ca68f9f-c830-443f-b85c-0f2e3a63b52f';
function response(created = false, active: Record<string, { isActive: boolean }> = {}): LogInResult {
  return { created, customerInfo: { entitlements: { active } } as unknown as CustomerInfo };
}
beforeEach(() => {
  identityCoordinator.setDesiredIdentity({ kind: 'unresolved' });
  jest.resetAllMocks();
  jest.mocked(initializeRevenueCat).mockResolvedValue(undefined);
  jest.mocked(Purchases.logIn).mockResolvedValue(response());
});
afterEach(async () => {
  await identityCoordinator.whenIdle();
  jest.restoreAllMocks();
  expect(Purchases.logOut).not.toHaveBeenCalled();
});

test.each([true, false])('created=%s does not determine Pro status', async created => {
  jest.mocked(Purchases.logIn).mockResolvedValueOnce(response(created, { chunk_pro: { isActive: true } }));
  await expect(identifyCustomer(userId)).resolves.toEqual({ status: 'identified', isPro: true });
  jest.mocked(Purchases.logIn).mockResolvedValueOnce(response(created));
  await expect(identifyCustomer(otherId)).resolves.toEqual({ status: 'identified', isPro: false });
  expect(Purchases.logIn).toHaveBeenCalledWith(userId);
});

test.each<Record<string, { isActive: boolean }>>([{ unrelated: { isActive: true } }, { chunk_pro: { isActive: false } }])('requires active chunk_pro %#', async active => {
  jest.mocked(Purchases.logIn).mockResolvedValueOnce(response(false, active));
  await expect(identifyCustomer(userId)).resolves.toEqual({ status: 'identified', isPro: false });
});

test.each(['', ' ', 'person@example.com', 'anonymous', '00000000-0000-0000-0000-000000000000', ` ${userId}`, `${userId}/`, 'not-a-uuid'])(
  'rejects unusable IDs without initializing or logging in %#', async id => {
    await expect(identifyCustomer(id)).resolves.toEqual({ status: 'failed', reason: 'invalid-user-id' });
    expect(initializeRevenueCat).not.toHaveBeenCalled();
    expect(Purchases.logIn).not.toHaveBeenCalled();
  },
);

test('initialization failure is sanitized and retry succeeds', async () => {
  jest.mocked(initializeRevenueCat).mockRejectedValueOnce(new Error('private details'));
  await expect(identifyCustomer(userId)).resolves.toEqual({ status: 'failed', reason: 'initialization' });
  expect(Purchases.logIn).not.toHaveBeenCalled();
  await expect(identifyCustomer(userId)).resolves.toEqual({ status: 'identified', isPro: false });
});

test('login failure is sanitized and releases lock for retry', async () => {
  jest.mocked(Purchases.logIn).mockRejectedValueOnce(new Error('private customer information'));
  await expect(identifyCustomer(userId)).resolves.toEqual({ status: 'failed', reason: 'login' });
  await expect(identifyCustomer(userId)).resolves.toEqual({ status: 'identified', isPro: false });
  expect(Purchases.logIn).toHaveBeenCalledTimes(2);
});

test('delegates to the singleton and same-user calls share the generation', async () => {
  const request = jest.spyOn(identityCoordinator, 'setDesiredIdentity');
  const wait = jest.spyOn(identityCoordinator, 'waitForGeneration');
  let ready!: () => void;
  jest.mocked(initializeRevenueCat).mockReturnValueOnce(new Promise(resolve => { ready = resolve; }));
  const pending = identifyCustomer(userId);
  expect(Purchases.logIn).not.toHaveBeenCalled();
  const duplicate = identifyCustomer(userId);
  expect(request).toHaveBeenCalledWith({ kind: 'identified', userId });
  expect(wait.mock.calls[0]).toEqual(wait.mock.calls[1]);
  ready();
  await expect(pending).resolves.toEqual({ status: 'identified', isPro: false });
  await expect(duplicate).resolves.toEqual({ status: 'identified', isPro: false });
  await expect(identifyCustomer(userId)).resolves.toEqual({ status: 'identified', isPro: false });
  expect(Purchases.logIn).toHaveBeenCalledTimes(1);
});

test('supersedes A immediately while B waits for its in-flight login', async () => {
  let finish!: (result: LogInResult) => void;
  let started!: () => void;
  const began = new Promise<void>(resolve => { started = resolve; });
  jest.mocked(Purchases.logIn).mockImplementationOnce(() => { started(); return new Promise(resolve => { finish = resolve; }); });
  const pending = identifyCustomer(userId);
  await began;
  expect(Purchases.logIn).toHaveBeenCalledTimes(1);
  const next = identifyCustomer(otherId);
  await expect(pending).resolves.toEqual({ status: 'superseded' });
  expect(Purchases.logIn).toHaveBeenCalledTimes(1);
  finish(response());
  await expect(next).resolves.toEqual({ status: 'identified', isPro: false });
  expect(Purchases.logIn).toHaveBeenLastCalledWith(otherId);
});

test('waits behind an exclusive reservation rather than falsely failing', async () => {
  await identifyCustomer(userId);
  await identityCoordinator.whenIdle();
  const reservation = identityCoordinator.tryReserve()!;
  const settled = jest.fn();
  const pending = identifyCustomer(otherId).then(settled);
  await identityCoordinator.whenIdle();
  expect(settled).not.toHaveBeenCalled();
  reservation.release(); await pending;
  expect(settled).toHaveBeenCalledWith({ status: 'identified', isPro: false });
});

test('rechecks generation after a ready result to avoid publishing stale success', async () => {
  await identifyCustomer(userId);
  const pending = identifyCustomer(userId);
  identityCoordinator.setDesiredIdentity({ kind: 'identified', userId: otherId });
  await expect(pending).resolves.toEqual({ status: 'superseded' });
});

test('unexpected coordinator rejection is sanitized', async () => {
  jest.spyOn(identityCoordinator, 'waitForGeneration').mockRejectedValueOnce(new Error('private details'));
  await expect(identifyCustomer(userId)).resolves.toEqual({ status: 'failed', reason: 'login' });
});
