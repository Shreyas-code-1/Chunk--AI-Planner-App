/**
 * The countdown ring on 3.3 FOCUS — RUNNING.
 *
 * **Substitution, flagged per §3.2.** The board draws this with a CSS
 * `conic-gradient`, which React Native has no equivalent for:
 *
 *   276x276 circle, background:
 *     conic-gradient(#fff 0 78%, rgba(255,255,255,.32) 78% 100%)
 *   232x232 inner circle in #F59332 holding the countdown
 *
 * It is drawn here as an SVG circle with `strokeDasharray`. That is a faithful
 * reproduction rather than an approximation, because the CSS uses **hard
 * stops** — there is no actual gradient, just two flat arcs — and an SVG arc
 * produces the same two flat arcs with the same 22px thickness
 * ((276 - 232) / 2). The circle is rotated -90 degrees so the sweep starts at
 * twelve o'clock the way the conic gradient does, rather than at three.
 *
 * Tell me if you would rather it were an image.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, radii } from '../../theme/tokens';

const SIZE = 276;
const INNER = 232;
const THICKNESS = (SIZE - INNER) / 2;

type Props = {
  /** 0..1 of the ring that is filled. */
  progress: number;
  size?: number;
  /** The filled arc. White on the orange focus screen. */
  color?: string;
  /** The unfilled remainder. */
  trackColor?: string;
  /** The countdown and its label. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ProgressRing({
  progress,
  size = SIZE,
  color = colors.white,
  trackColor = 'rgba(255,255,255,0.32)',
  children,
  style,
}: Props) {
  const scale = size / SIZE;
  const thickness = THICKNESS * scale;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(1, Math.max(0, progress)) * circumference;

  return (
    <View style={[{ width: size, height: size }, styles.container, style]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={thickness}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={thickness}
          fill="none"
          strokeDasharray={`${filled} ${circumference - filled}`}
          // Start at twelve o'clock, like the conic gradient.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View
        style={[
          styles.inner,
          {
            width: INNER * scale,
            height: INNER * scale,
            borderRadius: (INNER * scale) / 2,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  inner: {
    position: 'absolute',
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'circular',
    borderRadius: radii.pill,
  },
});
