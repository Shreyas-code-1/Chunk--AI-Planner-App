/**
 * Pro entitlement — stub until the 2.10 EAS build.
 *
 * RevenueCat (react-native-purchases) is a native module: importing it inside
 * Expo Go crashes the app, and we develop in Expo Go until the paywall. So this
 * is the same kind of seam as src/native/appBlocking.ts — every caller reads
 * the entitlement through this hook, and the real implementation drops in
 * behind it without any screen changing.
 *
 * It deliberately gates nothing today. Which screens and features are Pro-only,
 * and whether the paywall can be skipped, is still an open question (brief
 * §5, screen 2.10) and gating anything before that is answered would be
 * inventing product.
 */

/**
 * The two products on 2.16. Named here rather than in the screen because the
 * screen only picks one; what a pick means is billing's to define, and this is
 * the type the RevenueCat call will take.
 */
export type PlanId = 'yearly' | 'monthly';

export type ProState = {
  isPro: boolean;
  /** True while the entitlement is being fetched; always false in the stub. */
  loading: boolean;
};

/** True in a native build, false in Expo Go and on web. See ./availability. */
export { isBillingAvailable } from './availability';

export function usePro(): ProState {
  return { isPro: false, loading: false };
}

export { restorePurchases, type RestoreResult } from './restore';
