/**
 * Connectivity. Only screens that need the network ask — the planner and the
 * work store are local and keep working offline.
 */

import NetInfo, { useNetInfo } from '@react-native-community/netinfo';

/** False only when the device is known to be offline; unknown counts as online. */
export function useOnline(): boolean {
  const state = useNetInfo();
  return !(state.isConnected === false || state.isInternetReachable === false);
}

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !(state.isConnected === false || state.isInternetReachable === false);
}
