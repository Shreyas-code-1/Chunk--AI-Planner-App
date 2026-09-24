import Purchases, { type CustomerInfo, type LogInResult } from 'react-native-purchases';
import { initializeRevenueCat } from '../initialize';
import { createIdentityCoordinator } from '../identityCoordinator';

jest.mock('react-native-purchases', () => ({ __esModule: true,
  default: { logIn: jest.fn(), logOut: jest.fn(), isAnonymous: jest.fn() } }));
jest.mock('../initialize', () => ({ initializeRevenueCat: jest.fn() }));
const A = { kind: 'identified', userId: '8c62a3c1-b70f-498d-b3af-086afcce328b' } as const;
const B = { kind: 'identified', userId: '1ca68f9f-c830-443f-b85c-0f2e3a63b52f' } as const;
const anon = { kind: 'anonymous' } as const;
const info = (pro = false) => ({ entitlements: { active: pro ? { chunk_pro: { isActive: true } } : {} } }) as unknown as CustomerInfo;
const login = (pro = false): LogInResult => ({ customerInfo: info(pro), created: true });
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
let coordinator: ReturnType<typeof createIdentityCoordinator>;
async function desired(value: Parameters<typeof coordinator.setDesiredIdentity>[0]) {
  coordinator.setDesiredIdentity(value); await coordinator.whenIdle();
}
beforeEach(() => {
  jest.resetAllMocks();
  coordinator = createIdentityCoordinator();
  jest.mocked(initializeRevenueCat).mockResolvedValue(undefined);
  jest.mocked(Purchases.isAnonymous).mockResolvedValue(true);
  jest.mocked(Purchases.logOut).mockResolvedValue(info(true));
  jest.mocked(Purchases.logIn).mockResolvedValue(login());
});

test('unresolved startup is inert and cannot reserve', () => {
  expect(coordinator.getSnapshot()).toMatchObject({ status: 'unresolved', generation: 0, isPro: null });
  expect(coordinator.tryReserve()).toBeNull();
  expect(initializeRevenueCat).not.toHaveBeenCalled();
});
test('already anonymous becomes ready without logout or Pro claims', async () => {
  await desired(anon);
  expect(Purchases.isAnonymous).toHaveBeenCalledTimes(1);
  expect(Purchases.logOut).not.toHaveBeenCalled();
  expect(coordinator.getSnapshot()).toMatchObject({ status: 'ready', isPro: null });
});
test('anonymous to A inspects entitlement, not created', async () => {
  await desired(anon);
  jest.mocked(Purchases.logIn).mockResolvedValueOnce(login(true));
  await desired(A);
  expect(Purchases.logIn).toHaveBeenCalledWith(A.userId);
  expect(coordinator.getSnapshot()).toMatchObject({ status: 'ready', isPro: true });
  expect(Purchases.logOut).not.toHaveBeenCalled();
});
test('A to B uses login directly and clears A entitlement immediately', async () => {
  jest.mocked(Purchases.logIn).mockResolvedValueOnce(login(true));
  await desired(A);
  coordinator.setDesiredIdentity(B);
  expect(coordinator.getSnapshot()).toMatchObject({ status: 'transitioning', isPro: null });
  await coordinator.whenIdle();
  expect(Purchases.logIn).toHaveBeenLastCalledWith(B.userId);
  expect(Purchases.logOut).not.toHaveBeenCalled();
  expect(coordinator.getSnapshot().isPro).toBe(false);
});
test('A to anonymous logs out only after checking; returned entitlement is ignored', async () => {
  await desired(A);
  jest.mocked(Purchases.isAnonymous).mockResolvedValue(false);
  await desired(anon);
  expect(Purchases.logOut).toHaveBeenCalledTimes(1);
  expect(coordinator.getSnapshot()).toMatchObject({ status: 'ready', isPro: null });
});
test('same-user requests deduplicate while pending and ready', async () => {
  coordinator.setDesiredIdentity(A);
  const first = coordinator.getSnapshot();
  coordinator.setDesiredIdentity({ ...A });
  expect(coordinator.getSnapshot()).toBe(first);
  await coordinator.whenIdle();
  await desired(A);
  expect(Purchases.logIn).toHaveBeenCalledTimes(1);
});
test('rapid queued destinations are skipped', async () => {
  coordinator.setDesiredIdentity(A);
  coordinator.setDesiredIdentity(anon);
  coordinator.setDesiredIdentity(B);
  await coordinator.whenIdle();
  expect(Purchases.logIn).toHaveBeenCalledTimes(1);
  expect(Purchases.logIn).toHaveBeenCalledWith(B.userId);
  expect(Purchases.logOut).not.toHaveBeenCalled();
});
test('stale in-flight login cannot publish readiness or Pro for B', async () => {
  const first = deferred<LogInResult>();
  const second = deferred<LogInResult>();
  const started = deferred<void>();
  jest.mocked(Purchases.logIn).mockImplementationOnce(() => { started.resolve(); return first.promise; })
    .mockReturnValueOnce(second.promise);
  coordinator.setDesiredIdentity(A); await started.promise;
  coordinator.setDesiredIdentity(B);
  first.resolve(login(true));
  await Promise.resolve(); await Promise.resolve();
  expect(coordinator.getSnapshot()).toMatchObject({ desired: B, status: 'transitioning', isPro: null });
  second.resolve(login()); await coordinator.whenIdle();
  expect(coordinator.getSnapshot()).toMatchObject({ desired: B, status: 'ready', isPro: false });
});
test('unresolved invalidates an in-flight result', async () => {
  const pending = deferred<LogInResult>();
  const started = deferred<void>();
  jest.mocked(Purchases.logIn).mockImplementationOnce(() => { started.resolve(); return pending.promise; });
  coordinator.setDesiredIdentity(A); await started.promise;
  coordinator.setDesiredIdentity({ kind: 'unresolved' });
  pending.resolve(login(true)); await coordinator.whenIdle();
  expect(coordinator.getSnapshot()).toMatchObject({ status: 'unresolved', isPro: null });
});
test.each(['initialization', 'anonymous-check', 'login', 'logout'] as const)('%s failure blocks reservations until explicit retry', async stage => {
  const error = new Error('sensitive details');
  const target = stage === 'login' || stage === 'initialization' ? A : anon;
  if (stage === 'initialization') jest.mocked(initializeRevenueCat).mockRejectedValueOnce(error);
  if (stage === 'anonymous-check') jest.mocked(Purchases.isAnonymous).mockRejectedValueOnce(error);
  if (stage === 'login') jest.mocked(Purchases.logIn).mockRejectedValueOnce(error);
  if (stage === 'logout') {
    jest.mocked(Purchases.isAnonymous).mockResolvedValue(false);
    jest.mocked(Purchases.logOut).mockRejectedValueOnce(error);
  }
  await desired(target);
  expect(coordinator.getSnapshot()).toMatchObject({ status: 'failed', failure: stage, isPro: null });
  expect(coordinator.tryReserve()).toBeNull();
  const failed = coordinator.getSnapshot();
  await desired(target);
  expect(coordinator.getSnapshot()).toBe(failed);
  coordinator.retry(); await coordinator.whenIdle();
  expect(coordinator.getSnapshot()).toMatchObject({ status: 'ready', failure: null });
});
test('reservation is exclusive and release is idempotent', async () => {
  await desired(anon);
  const reservation = coordinator.tryReserve()!;
  expect(reservation.isCurrent()).toBe(true);
  expect(coordinator.tryReserve()).toBeNull();
  reservation.release();
  const next = coordinator.tryReserve()!;
  reservation.release();
  expect(coordinator.tryReserve()).toBeNull();
  expect(reservation.isCurrent()).toBe(false);
  next.release();
});
test('transition waits for reservation; generation change invalidates its result immediately', async () => {
  await desired(anon);
  const reservation = coordinator.tryReserve()!;
  coordinator.setDesiredIdentity(A);
  coordinator.setDesiredIdentity(B);
  await coordinator.whenIdle();
  expect(reservation.isCurrent()).toBe(false);
  expect(Purchases.logIn).not.toHaveBeenCalled();
  expect(coordinator.tryReserve()).toBeNull();
  reservation.release(); await coordinator.whenIdle();
  expect(Purchases.logIn).toHaveBeenCalledTimes(1);
  expect(Purchases.logIn).toHaveBeenCalledWith(B.userId);
});
test('initialization is awaited and obsolete identity is skipped afterward', async () => {
  const pending = deferred<void>();
  jest.mocked(initializeRevenueCat).mockReturnValueOnce(pending.promise);
  coordinator.setDesiredIdentity(A); await Promise.resolve();
  expect(Purchases.logIn).not.toHaveBeenCalled();
  coordinator.setDesiredIdentity(B);
  pending.resolve(); await coordinator.whenIdle();
  expect(Purchases.logIn).toHaveBeenCalledTimes(1);
  expect(Purchases.logIn).toHaveBeenCalledWith(B.userId);
});
test('invalid ID fails closed and a later valid destination succeeds', async () => {
  await desired({ kind: 'identified', userId: 'person@example.com' });
  expect(coordinator.getSnapshot().failure).toBe('invalid-user-id');
  expect(Purchases.logIn).not.toHaveBeenCalled();
  await desired(A);
  expect(coordinator.getSnapshot().status).toBe('ready');
});
