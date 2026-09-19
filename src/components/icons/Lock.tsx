/**
 * Lock icon. A locked path node (3.2).
 *
 * Traced from design/board.html, not from an icon library. The board uses 2.4, 2.6.
 * Stroke width and round caps are the board's and are never normalised.
 */

import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

export function Lock({ size = 24, color = colors.ink, strokeWidth = 2.4 }: IconProps) {
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
      <Rect x="5" y="11" width="14" height="9" rx="3" />
      <Path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
    </Svg>
  );
}
