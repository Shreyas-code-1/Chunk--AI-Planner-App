/**
 * Whether real billing (RevenueCat) and provider sign-in can run.
 *
 * `react-native-purchases` is a native module that only exists in a native
 * build. Expo Go (and web) don't have it, so there it is never loaded: the
 * paywall shows sample offerings, purchase/restore explain they need the App
 * Store build, and Apple/Google sign-in are hidden — their OAuth callback
 * (`chunk://login`) can't return to Expo Go anyway. Email sign-in always works.
 *
 * A function, not a constant, so tests can switch environments.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

export function isBillingAvailable(): boolean {
  return (
    Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient
  );
}

export const BILLING_UNAVAILABLE_MESSAGE =
  'Purchases work in the App Store build of Chunk, not in Expo Go.';
