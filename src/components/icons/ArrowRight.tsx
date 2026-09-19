/**
 * ArrowRight icon. Continue, and "straight into chunk 4".
 *
 * Traced from design/board.html, not from an icon library. The board uses 2.6.
 * Stroke width and round caps are the board's and are never normalised.
 */

import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

export function ArrowRight({ size = 24, color = colors.ink, strokeWidth = 2.6 }: IconProps) {
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
      <Path d="M4 12h15M13 6l6 6-6 6" />
    </Svg>
  );
}
