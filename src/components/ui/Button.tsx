/**
 * The pressable with the hard bottom edge.
 *
 * The edge is a solid offset shadow, not a blur: shadowRadius 0, opacity 1,
 * matching the board's `box-shadow: 0 6px 0 #6E4A28` exactly (brief §3.2).
 *
 * Pressing sinks the face onto its edge — the button translates down by the
 * edge height while the edge itself disappears — and the haptic fires at the
 * same instant, on press-in, not on release (§7a).
 */

import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '../../lib/haptics';
import { colors, fonts, press, radii, shadows } from '../../theme/tokens';

type Variant = 'primary' | 'secondary' | 'dark' | 'onOrange';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

type Spec = {
  background: string;
  label: string;
  edge: string;
  depth: number;
  /** Only `secondary` is outlined; the filled variants draw no border. */
  border?: string;
  /** The board's secondary sits a half-point smaller and a touch shorter. */
  fontSize?: number;
  paddingVertical?: number;
};

/** Each variant's exact board values: fill, label colour, edge colour, edge height. */
const VARIANTS: Record<Variant, Spec> =
  {
    primary: { background: colors.orange, label: colors.white, edge: colors.edgeBrown, depth: 6 },
    // 2.2's "I ALREADY HAVE AN ACCOUNT": white, cream-bordered, and it keeps
    // the brown edge rather than taking one tinted to its own fill.
    secondary: {
      background: colors.card,
      label: colors.orangeDeep,
      edge: colors.edgeBrown,
      depth: 5,
      border: colors.cream,
      fontSize: 14.5,
      paddingVertical: 15,
    },
    dark: { background: colors.ink, label: colors.white, edge: colors.edgeInk, depth: 5 },
    // On the orange focus screen the edge is a translucent black rather than
    // a brown, because there is no cream beneath it to tint.
    onOrange: {
      background: colors.white,
      label: colors.orangeDeep,
      edge: 'rgba(0,0,0,0.14)',
      depth: 6,
    },
  };

export function Button({ label, onPress, variant = 'primary', disabled, style }: Props) {
  const sunk = useSharedValue(0);
  const spec = VARIANTS[variant];

  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateY: sunk.value * spec.depth },
      { scale: 1 - sunk.value * (1 - press.scale) },
    ],
    shadowOpacity: 1 - sunk.value,
  }));

  const onPressIn = useCallback(() => {
    if (disabled) return;
    haptic('press');
    sunk.value = withTiming(1, { duration: press.inMs });
  }, [disabled, sunk]);

  const onPressOut = useCallback(() => {
    sunk.value = withTiming(0, { duration: press.outMs });
  }, [sunk]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={style}
    >
      <Animated.View
        style={[
          styles.face,
          { backgroundColor: spec.background },
          spec.paddingVertical != null && { paddingVertical: spec.paddingVertical },
          spec.border != null && { borderWidth: 2, borderColor: spec.border },
          shadows.hardEdge(spec.depth, spec.edge),
          animated,
          disabled && styles.disabled,
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: spec.label },
            spec.fontSize != null && {
              fontSize: spec.fontSize,
              letterSpacing: spec.fontSize * 0.08,
            },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/** Reserves the space the edge occupies, so buttons in a row line up. */
export function ButtonEdgeSpacer({ depth = 6 }: { depth?: number }) {
  return <View style={{ height: depth }} />;
}

const styles = StyleSheet.create({
  face: {
    borderRadius: radii.xl,
    paddingVertical: 17,
    paddingHorizontal: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.body.black,
    fontSize: 15,
    letterSpacing: 15 * 0.08, // the board's .08em, in points
    textAlign: 'center',
  },
  // TODO(design): the board draws no disabled state. This is a placeholder
  // opacity, flagged rather than invented — see docs/0a-open-questions.md.
  disabled: { opacity: 0.45 },
});
