/**
 * Check icon. A completed chunk or a selected option. The board draws it at three different stroke weights depending on size - they are passed in, never normalised.
 *
 * Traced from design/board.html, not from an icon library. The board uses 3.2, 3.4, 3.6.
 * Stroke width and round caps are the board's and are never normalised.
 */

import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

export function Check({ size = 24, color = colors.ink, strokeWidth = 3.4 }: IconProps) {
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
      <Path d="M5 12.5l4.5 4.5L19 7" />
    </Svg>
  );
}
