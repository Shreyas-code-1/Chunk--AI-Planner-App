import Purchases, { type PurchasesPackage } from 'react-native-purchases';

import { revenueCatConfig } from './config';
import { initializeRevenueCat } from './initialize';
import { identityCoordinator } from './identityCoordinator';

export type PurchaseResult =
  | { status: 'purchased' }
  | { status: 'entitlement-inactive' }
  | { status: 'cancelled' }
  | { status: 'failed'; reason: 'in-progress' | 'identity-not-ready' | 'identity-changed' | 'initialization' | 'purchase' };

/** Explicitly invoked by a caller; never retries or starts a purchase automatically. */
export async function purchasePlan(pkg: PurchasesPackage): Promise<PurchaseResult> {
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
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const entitlement = customerInfo.entitlements.active[revenueCatConfig.entitlementIdentifier];
      if (!reservation.isCurrent()) return { status: 'failed', reason: 'identity-changed' };
      return entitlement?.isActive
        ? { status: 'purchased' }
        : { status: 'entitlement-inactive' };
    } catch (error: unknown) {
      if (
        typeof error === 'object' && error !== null && 'code' in error &&
        error.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
      ) {
        return { status: 'cancelled' };
      }
      // Do not expose raw SDK errors, receipts, or customer information.
      return { status: 'failed', reason: 'purchase' };
    }
  } finally {
    reservation.release();
  }
}
