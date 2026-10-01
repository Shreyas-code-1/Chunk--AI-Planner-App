import { isBillingAvailable } from './availability';
import { getPurchases } from './sdk';

import { revenueCatConfig } from './config';
import { initializeRevenueCat } from './initialize';
import { identityCoordinator } from './identityCoordinator';

export type RestoreResult =
  | { status: 'restored' }
  | { status: 'entitlement-inactive' }
  | { status: 'failed'; reason: 'unavailable' | 'in-progress' | 'identity-not-ready' | 'identity-changed' | 'initialization' | 'restore' };

/** Invoke only on explicit user request; no automatic restoration or retries. */
export async function restorePurchases(): Promise<RestoreResult> {
  if (!isBillingAvailable()) return { status: 'failed', reason: 'unavailable' };
  const reservation = identityCoordinator.tryReserve();
  if (!reservation) return { status: 'failed', reason:
    identityCoordinator.getSnapshot().status === 'ready' ? 'in-progress' : 'identity-not-ready' };
  try {
    try {
      await initializeRevenueCat();
    } catch {
      return { status: 'failed', reason: 'initialization' };
    }

    if (!reservation.isCurrent()) return { status: 'failed', reason: 'identity-changed' };

    try {
      const customerInfo = await getPurchases().restorePurchases();
      const entitlement = customerInfo.entitlements.active[revenueCatConfig.entitlementIdentifier];
      if (!reservation.isCurrent()) return { status: 'failed', reason: 'identity-changed' };
      return entitlement?.isActive
        ? { status: 'restored' }
        : { status: 'entitlement-inactive' };
    } catch {
      // Keep raw SDK errors and customer/purchase information out of the result.
      return { status: 'failed', reason: 'restore' };
    }
  } finally {
    reservation.release();
  }
}
