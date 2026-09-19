/**
 * Haptics.
 *
 * Every interactive element gets tactile feedback, fired on press-*in* at the
 * same moment the visual press state starts. Visual and haptic must be
 * simultaneous or it feels broken (brief §7a).
 *
 * Screens never call expo-haptics directly — they call these named intents, so
 * the mapping lives in one place and the whole thing can be switched off from
 * one place too.
 */

import * as Haptics from 'expo-haptics';

type Intent =
  /** Chips, tabs, list rows, toggles, slider detents, week-strip day taps. */
  | 'select'
  /** Primary buttons: CONTINUE, START, the big ones with the hard bottom edge. */
  | 'press'
  /** Finishing an assignment, earning a badge, a correct quiz answer. */
  | 'success'
  /** Destructive confirmations, a wrong quiz answer. */
  | 'warn'
  /** Completing a chunk. Used sparingly — this is the one that should land. */
  | 'celebrate';

let enabled = true;

/** Settings owns this; default on. */
export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}

export function hapticsEnabled(): boolean {
  return enabled;
}

const fire: Record<Intent, () => Promise<void>> = {
  select: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  press: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warn: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  celebrate: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
};

/**
 * Never awaited by callers: a haptic that fails is not worth interrupting a
 * press for, and never worth a crash.
 */
export function haptic(intent: Intent): void {
  if (!enabled) return;
  void fire[intent]().catch(() => {});
}
