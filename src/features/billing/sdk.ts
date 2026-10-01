/**
 * The only place `react-native-purchases` is loaded. It is required lazily and
 * only when `isBillingAvailable()`, so Expo Go never evaluates the native
 * module. Type imports elsewhere are erased at build time and are safe.
 */

import type PurchasesModule from 'react-native-purchases';

import { isBillingAvailable } from './availability';

export type Purchases = typeof PurchasesModule;

export function getPurchases(): Purchases {
  if (!isBillingAvailable()) {
    throw new Error('react-native-purchases is not available in this environment.');
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-purchases').default as Purchases;
}
