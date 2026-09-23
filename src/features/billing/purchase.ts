import Purchases, { type PurchasesPackage } from 'react-native-purchases';

import { revenueCatConfig } from './config';
import { initializeRevenueCat } from './initialize';

export type PurchaseResult =
  | { status: 'purchased' }
  | { status: 'entitlement-inactive' }
  | { status: 'cancelled' }
  | { status: 'failed'; reason: 'in-progress' | 'initialization' | 'purchase' };

let purchaseInProgress = false;

/** Explicitly invoked by a caller; never retries or starts a purchase automatically. */
export async function purchasePlan(pkg: PurchasesPackage): Promise<PurchaseResult> {
  // Lock before the first await, including while initialization is pending.
  if (purchaseInProgress) return { status: 'failed', reason: 'in-progress' };
  purchaseInProgress = true;
  try {
    try {
      await initializeRevenueCat();
    } catch {
      return { status: 'failed', reason: 'initialization' };
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const entitlement = customerInfo.entitlements.active[revenueCatConfig.entitlementIdentifier];
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
    purchaseInProgress = false;
  }
}
