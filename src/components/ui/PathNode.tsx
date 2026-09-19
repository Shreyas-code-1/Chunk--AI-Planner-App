/**
 * A node on 3.2 TODAY — PATH.
 *
 * Three states, all drawn in the board's COMPONENTS row. Note that "now" is
 * deliberately larger than the other two and carries a white ring — it is the
 * one thing on the screen the student is meant to look at.
 *
 *  done   60x60, #2FB37A, edge 0 6px 0 #1E8659, check at 26px / 3.4
 *  now    66x66, #F59332, edge 0 6px 0 #6E4A28, 4px white ring, play at 28 / 2.6
 *  locked 60x60, #EFE4D8, edge 0 6px 0 #6E4A28, lock at 24px / 2.4 in #B4A498
 */

import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Check, Lock, Play } from '../icons';
import { haptic } from '../../lib/haptics';
import { colors, radii, shadows } from '../../theme/tokens';

export type PathNodeState = 'done' | 'now' | 'locked';

type Props = {
  state: PathNodeState;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function PathNode({ state, onPress, style }: Props) {
  // Locked nodes are not tappable on the board. Whether a student may start
  // out of order is still open (docs/0a-open-questions.md, Q14); until it is
  // answered the board's behaviour stands.
  const disabled = state === 'locked' || !onPress;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => !disabled && haptic('press')}
      style={style}
    >
      <View style={[styles.base, STATE[state].shape, STATE[state].shadow]}>
        {state === 'done' ? <Check size={26} color={colors.white} strokeWidth={3.4} /> : null}
        {state === 'now' ? <Play size={28} color={colors.white} strokeWidth={2.6} /> : null}
        {state === 'locked' ? (
          <Lock size={24} color={colors.mutedLight} strokeWidth={2.4} />
        ) : null}
      </View>
    </Pressable>
  );
}

const STATE = {
  done: {
    shape: { width: 60, height: 60, backgroundColor: colors.success },
    shadow: shadows.hardEdge(6, colors.successDeep),
  },
  now: {
    shape: {
      width: 66,
      height: 66,
      backgroundColor: colors.orange,
      borderWidth: 4,
      borderColor: colors.white,
    },
    shadow: shadows.hardEdge(6),
  },
  locked: {
    shape: { width: 60, height: 60, backgroundColor: colors.locked },
    shadow: shadows.hardEdge(6),
  },
} as const;

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
