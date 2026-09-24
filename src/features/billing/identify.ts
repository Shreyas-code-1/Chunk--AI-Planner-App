import Purchases from 'react-native-purchases';

import { revenueCatConfig } from './config';
import { initializeRevenueCat } from './initialize';

export type IdentifyCustomerResult =
  | { status: 'identified'; isPro: boolean }
  | { status: 'failed'; reason: 'invalid-user-id' | 'in-progress' | 'initialization' | 'login' };

// This operation accepts Supabase user UUIDs, not emails or arbitrary customer labels.
const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let identifying = false;

/** Pass session.user.id unchanged. No logout, automatic synchronization, or retries. */
export async function identifyCustomer(appUserId: string): Promise<IdentifyCustomerResult> {
  if (typeof appUserId !== 'string' || !USER_ID.test(appUserId) ||
      appUserId === '00000000-0000-0000-0000-000000000000') {
    return { status: 'failed', reason: 'invalid-user-id' };
  }
  if (identifying) return { status: 'failed', reason: 'in-progress' };
  identifying = true;
  try {
    try {
      await initializeRevenueCat();
    } catch {
      return { status: 'failed', reason: 'initialization' };
    }
    try {
      const { customerInfo } = await Purchases.logIn(appUserId);
      // `created` describes the customer record, never subscription access.
      const entitlement = customerInfo.entitlements.active[revenueCatConfig.entitlementIdentifier];
      return { status: 'identified', isPro: entitlement?.isActive === true };
    } catch {
      return { status: 'failed', reason: 'login' };
    }
  } finally {
    identifying = false;
  }
}
