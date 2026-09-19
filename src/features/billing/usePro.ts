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

export type ProState = {
  isPro: boolean;
  /** True while the entitlement is being fetched; always false in the stub. */
  loading: boolean;
};

/** True once RevenueCat is wired up. Screens should not branch on this yet. */
export const isBillingAvailable = false;

export function usePro(): ProState {
  return { isPro: false, loading: false };
}

/** Placeholder so call sites can exist before the native module does. */
export async function restorePurchases(): Promise<void> {
  throw new Error('Purchases require a development build; not available in Expo Go.');
}
