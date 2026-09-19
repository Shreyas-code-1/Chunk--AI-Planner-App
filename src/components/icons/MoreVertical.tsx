/**
 * MoreVertical icon. Row overflow menu.
 *
 * Traced from design/board.html, not from an icon library. The board uses 3.
 * Stroke width and round caps are the board's and are never normalised.
 */

import Svg, { Circle } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

export function MoreVertical({ size = 24, color = colors.ink, strokeWidth = 3 }: IconProps) {
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
      <Circle cx="12" cy="5" r="1" />
      <Circle cx="12" cy="12" r="1" />
      <Circle cx="12" cy="19" r="1" />
    </Svg>
  );
}
