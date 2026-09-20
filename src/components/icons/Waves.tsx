/**
 * Waves — two ripples. "I get distracted" on 2.9.
 *
 * Traced from design/board.html.
 */

import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

export function Waves({ size = 24, color = colors.ink, strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
      <Path d="M3 17c2-3 4-3 6 0" />
    </Svg>
  );
}
