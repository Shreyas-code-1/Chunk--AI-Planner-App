import { getPurchases } from './sdk';
import { revenueCatConfig } from './config';
import { initializeRevenueCat } from './initialize';

export type DesiredIdentity = Readonly<
  { kind: 'unresolved' } | { kind: 'anonymous' } | { kind: 'identified'; userId: string }
>;
export type IdentityFailure = 'invalid-user-id' | 'initialization' | 'anonymous-check' | 'login' | 'logout';
export type IdentityGenerationResult = Readonly<
  | { status: 'ready'; generation: number; isPro: boolean | null }
  | { status: 'failed'; generation: number; reason: IdentityFailure }
  | { status: 'superseded'; generation: number }
>;
export type IdentitySnapshot = Readonly<{
  desired: DesiredIdentity;
  generation: number;
  status: 'unresolved' | 'transitioning' | 'ready' | 'failed';
  /** null means unknown/not applicable; anonymous readiness never grants Pro. */
  isPro: boolean | null;
  failure: IdentityFailure | null;
}>;
export type IdentityReservation = Readonly<{
  generation: number;
  isCurrent(): boolean;
  /** Release in finally. Idempotent; never starts or replays a purchase. */
  release(): void;
}>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Factory for isolated tests. Future app consumers must use the shared singleton below. */
export function createIdentityCoordinator() {
  let snapshot: IdentitySnapshot = Object.freeze({
    desired: Object.freeze({ kind: 'unresolved' }), generation: 0,
    status: 'unresolved', isPro: null, failure: null,
  });
  let worker: Promise<void> | null = null;
  let reserved = false;
  const waiters = new Map<number, Set<(result: IdentityGenerationResult) => void>>();

  function outcome(generation: number): IdentityGenerationResult | null {
    if (generation < snapshot.generation) return Object.freeze({ status: 'superseded', generation });
    if (snapshot.status === 'ready') return Object.freeze({ status: 'ready', generation, isPro: snapshot.isPro });
    if (snapshot.status === 'failed' && snapshot.failure) {
      return Object.freeze({ status: 'failed', generation, reason: snapshot.failure });
    }
    return null;
  }

  /**
   * Wait for an issued generation, independently of worker/reservation activity.
   * Older generations are superseded, even if they were previously ready/failed.
   * Unresolved generations wait until superseded. Invalid/future numbers reject.
   */
  function waitForGeneration(generation: number): Promise<IdentityGenerationResult> {
    if (!Number.isSafeInteger(generation) || generation < 0 || generation > snapshot.generation) {
      return Promise.reject(new RangeError('Expected an issued identity generation.'));
    }
    const result = outcome(generation);
    if (result) return Promise.resolve(result);
    return new Promise(resolve => {
      const group = waiters.get(generation) ?? new Set();
      group.add(resolve);
      waiters.set(generation, group);
    });
  }

  function update(patch: Partial<IdentitySnapshot>) {
    snapshot = Object.freeze({ ...snapshot, ...patch });
    for (const [generation, group] of waiters) {
      const result = outcome(generation);
      if (!result) continue;
      waiters.delete(generation);
      for (const resolve of group) resolve(result);
      group.clear();
    }
  }

  async function reconcile() {
    while (snapshot.status === 'transitioning' && !reserved) {
      const { generation, desired } = snapshot;
      const current = () => snapshot.generation === generation;
      let stage: IdentityFailure = 'initialization';
      try {
        await initializeRevenueCat();
        if (!current()) continue;
        if (desired.kind === 'identified') {
          stage = 'login';
          const { customerInfo } = await getPurchases().logIn(desired.userId);
          if (current()) update({ status: 'ready', failure: null,
            isPro: customerInfo.entitlements.active[revenueCatConfig.entitlementIdentifier]?.isActive === true });
        } else if (desired.kind === 'anonymous') {
          stage = 'anonymous-check';
          const anonymous = await getPurchases().isAnonymous();
          if (!current()) continue;
          if (!anonymous) {
            stage = 'logout';
            await getPurchases().logOut();
          }
          if (current()) update({ status: 'ready', isPro: null, failure: null });
        }
      } catch {
        if (current()) update({ status: 'failed', isPro: null, failure: stage });
      }
    }
  }

  function kick() {
    if (worker || reserved || snapshot.status !== 'transitioning') return;
    // Schedule after assigning worker, so there can only ever be one worker.
    worker = Promise.resolve().then(reconcile).finally(() => {
      worker = null;
      kick();
    });
  }

  function setDesiredIdentity(identity: DesiredIdentity): IdentitySnapshot {
    const old = snapshot.desired;
    const same = old.kind === identity.kind &&
      (old.kind !== 'identified' || (identity.kind === 'identified' && old.userId === identity.userId));
    if (same) return snapshot; // A failed request requires explicit retry.
    const invalid = identity.kind === 'identified' &&
      (typeof identity.userId !== 'string' || !UUID.test(identity.userId) ||
       identity.userId === '00000000-0000-0000-0000-000000000000');
    update({ desired: Object.freeze({ ...identity }), generation: snapshot.generation + 1,
      status: invalid ? 'failed' : identity.kind === 'unresolved' ? 'unresolved' : 'transitioning',
      isPro: null, failure: invalid ? 'invalid-user-id' : null });
    kick();
    return snapshot;
  }

  function retry(): IdentitySnapshot {
    if (snapshot.status === 'failed' && snapshot.failure !== 'invalid-user-id') {
      update({ generation: snapshot.generation + 1, status: 'transitioning', failure: null, isPro: null });
      kick();
    }
    return snapshot;
  }

  function tryReserve(): IdentityReservation | null {
    if (snapshot.status !== 'ready' || worker || reserved) return null;
    reserved = true;
    const generation = snapshot.generation;
    let released = false;
    return Object.freeze({
      generation,
      isCurrent: () => !released && snapshot.generation === generation && snapshot.status === 'ready',
      release() {
        if (released) return;
        released = true;
        reserved = false;
        kick();
      },
    });
  }

  return {
    getSnapshot: (): IdentitySnapshot => snapshot,
    waitForGeneration,
    setDesiredIdentity,
    retry,
    tryReserve,
    /** Wait for scheduled SDK work only; a held reservation must be released separately. */
    async whenIdle(): Promise<void> { while (worker) await worker; },
  };
}

// Inert until explicitly requested. Not wired into any production flow in this phase.
export const identityCoordinator = createIdentityCoordinator();
