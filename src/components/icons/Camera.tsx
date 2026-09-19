/**
 * Camera icon. Scan to chunk (4.1).
 *
 * Traced from design/board.html, not from an icon library. The board uses 2.4.
 * Stroke width and round caps are the board's and are never normalised.
 */

import Svg, { Circle, Rect } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

export function Camera({ size = 24, color = colors.ink, strokeWidth = 2.4 }: IconProps) {
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
      <Rect x="4" y="6" width="16" height="13" rx="4" />
      <Circle cx="12" cy="12.5" r="3" />
    </Svg>
  );
}
