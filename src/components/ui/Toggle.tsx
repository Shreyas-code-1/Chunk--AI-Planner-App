/**
 * Toggle.
 *
 * 52x30 pill, 3px inset, 24x24 white knob. On is `#FA7814`, off is `#EFE1D2`.
 * The board draws both states, so nothing here is invented.
 */

import { useEffect } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../lib/haptics';
import { colors, press, radii } from '../../theme/tokens';

const WIDTH = 52;
const HEIGHT = 30;
const INSET = 3;
const KNOB = 24;
const TRAVEL = WIDTH - KNOB - INSET * 2;

type Props = {
  value: boolean;
  onChange(value: boolean): void;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Toggle({ value, onChange, accessibilityLabel, disabled, style }: Props) {
  const on = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    on.value = withTiming(value ? 1 : 0, { duration: press.outMs });
  }, [value, on]);

  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: on.value * TRAVEL }] }));
  const track = useAnimatedStyle(() => ({
    backgroundColor: on.value > 0.5 ? colors.orange : colors.cream,
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => {
        haptic('select');
        onChange(!value);
      }}
      style={style}
    >
      <Animated.View style={[styles.track, track, disabled && styles.disabled]}>
        <Animated.View style={[styles.knob, knob]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: radii.pill,
    padding: INSET,
    justifyContent: 'center',
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
  },
  // TODO(design): no disabled toggle on the board. Placeholder opacity.
  disabled: { opacity: 0.45 },
});
