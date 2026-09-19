/**
 * ChevronLeft icon. Back.
 *
 * Traced from design/board.html, not from an icon library. The board uses 2.8.
 * Stroke width and round caps are the board's and are never normalised.
 */

import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

export function ChevronLeft({ size = 24, color = colors.ink, strokeWidth = 2.8 }: IconProps) {
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
      <Path d="M15 5l-7 7 7 7" />
    </Svg>
  );
}
