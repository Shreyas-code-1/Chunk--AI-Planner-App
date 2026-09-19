/**
 * ListLines icon. All work / list view.
 *
 * Traced from design/board.html, not from an icon library. The board uses 2.4.
 * Stroke width and round caps are the board's and are never normalised.
 */

import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

export function ListLines({ size = 24, color = colors.ink, strokeWidth = 2.4 }: IconProps) {
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
      <Path d="M5 6.5h14M5 12h14M5 17.5h9" />
    </Svg>
  );
}
