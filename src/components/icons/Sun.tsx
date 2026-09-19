/**
 * Sun icon. Best time of day (2.6).
 *
 * Traced from design/board.html, not from an icon library. The board uses 2.2.
 * Stroke width and round caps are the board's and are never normalised.
 */

import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

export function Sun({ size = 24, color = colors.ink, strokeWidth = 2.2 }: IconProps) {
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
      <Circle cx="12" cy="12" r="3.4" />
      <Path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </Svg>
  );
}
