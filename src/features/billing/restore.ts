import Purchases from 'react-native-purchases';

import { revenueCatConfig } from './config';
import { initializeRevenueCat } from './initialize';

export type RestoreResult =
  | { status: 'restored' }
  | { status: 'entitlement-inactive' }
  | { status: 'failed'; reason: 'in-progress' | 'initialization' | 'restore' };

let restoreInProgress = false;

/** Invoke only on explicit user request; no automatic restoration or retries. */
export async function restorePurchases(): Promise<RestoreResult> {
  if (restoreInProgress) return { status: 'failed', reason: 'in-progress' };
  restoreInProgress = true;
  try {
    try {
      await initializeRevenueCat();
    } catch {
      return { status: 'failed', reason: 'initialization' };
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      const entitlement = customerInfo.entitlements.active[revenueCatConfig.entitlementIdentifier];
      return entitlement?.isActive
        ? { status: 'restored' }
        : { status: 'entitlement-inactive' };
    } catch {
      // Keep raw SDK errors and customer/purchase information out of the result.
      return { status: 'failed', reason: 'restore' };
    }
  } finally {
    restoreInProgress = false;
  }
}
