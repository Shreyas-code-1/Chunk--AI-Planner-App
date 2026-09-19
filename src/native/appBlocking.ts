/**
 * App blocking — stub only (brief §8).
 *
 * During a focus session, distracting apps will eventually be blocked. That
 * needs iOS FamilyControls / Screen Time, which requires a special Apple
 * entitlement we have to apply for and that is not guaranteed to be approved.
 *
 * Until then this module returns mocked values. Every caller goes through this
 * interface and never touches a platform API directly, so the real
 * implementation drops in without any screen changing.
 */

export type BlockingStatus = {
  /** Whether the Screen Time entitlement has been granted by the user. */
  authorized: boolean;
  /** Whether a blocking session is running right now. */
  active: boolean;
  /** When the current session ends, if one is running. */
  endsAt: Date | null;
};

const stub: BlockingStatus = { authorized: false, active: false, endsAt: null };

/**
 * True once the native implementation exists. Screens can read this to decide
 * whether to offer app blocking at all, rather than showing a control that
 * does nothing — a visible control that does nothing is an App Store rejection
 * under App Completeness.
 */
export const isAppBlockingAvailable = false;

export async function requestPermission(): Promise<boolean> {
  return false;
}

export async function startBlockingSession(_durationMs: number): Promise<BlockingStatus> {
  return stub;
}

export async function endSession(): Promise<BlockingStatus> {
  return stub;
}

export async function getStatus(): Promise<BlockingStatus> {
  return stub;
}
