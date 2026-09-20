/**
 * Clock — a face with hands. Distinct from Timer, which is a stopwatch with a
 * crown; the board uses this one on 2.7's note and again on 2.9.
 *
 * Traced from design/board.html. 2.7 draws the hand as `l3.5 2` and 2.9 as
 * `l4 2`; the 2.9 form is used, being the larger and later drawing.
 */

import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

export function Clock({ size = 24, color = colors.ink, strokeWidth = 2.4 }: IconProps) {
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
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l4 2" />
    </Svg>
  );
}
