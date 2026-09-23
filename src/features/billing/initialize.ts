import Purchases from 'react-native-purchases';

import { env } from '../../lib/env';

let initialization: Promise<void> | undefined;

/** Shared across root remounts; no identity, offerings, or purchase operations. */
export function initializeRevenueCat(): Promise<void> {
  if (!initialization) {
    initialization = (async () => {
      // Also respects an SDK instance that survived a development reload.
      if (!(await Purchases.isConfigured())) {
        // Omitting appUserID lets RevenueCat create its anonymous identity.
        Purchases.configure({ apiKey: env.revenueCatPublicSdkKey() });
      }
    })().catch(() => {
      initialization = undefined;
      // Never propagate SDK errors that might contain configuration values.
      throw new Error('RevenueCat initialization failed. Check the local billing configuration.');
    });
  }
  return initialization;
}
