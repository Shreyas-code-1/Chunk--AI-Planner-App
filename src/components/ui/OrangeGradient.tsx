/**
 * The board's full-bleed orange gradient, behind 2.1 SPLASH and 2.14.
 *
 * `linear-gradient(160deg, #FC9633 0%, #FA7814 45%, #E56C08 100%)`.
 *
 * React Native has no gradient and expo-linear-gradient is not a dependency,
 * so this is an SVG rect — which means the CSS angle has to become two points.
 * CSS measures clockwise from "to top" and sizes the gradient line to cover
 * the box: L = |W·sin A| + |H·cos A|, centred. Computing that from the live
 * dimensions rather than the board's 390x844 keeps the angle honest on every
 * device; hard-coded fractions would shear it on any other aspect ratio.
 */

import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '../../theme/tokens';

export function OrangeGradient() {
  const { width, height } = useWindowDimensions();

  const radians = (160 * Math.PI) / 180;
  const dx = Math.sin(radians);
  const dy = -Math.cos(radians);
  const length = Math.abs(width * dx) + Math.abs(height * dy);
  const [cx, cy] = [width / 2, height / 2];

  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        <LinearGradient
          id="orange"
          gradientUnits="userSpaceOnUse"
          x1={cx - (dx * length) / 2}
          y1={cy - (dy * length) / 2}
          x2={cx + (dx * length) / 2}
          y2={cy + (dy * length) / 2}
        >
          <Stop offset="0" stopColor={colors.orangeGradient[0]} />
          <Stop offset="0.45" stopColor={colors.orangeGradient[1]} />
          <Stop offset="1" stopColor={colors.orangeGradient[2]} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#orange)" />
    </Svg>
  );
}
