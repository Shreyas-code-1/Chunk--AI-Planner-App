/**
 * Bell with a clapper — "I forget things are due" on 2.9.
 *
 * Traced from design/board.html. Not the same drawing as Bell: this board
 * gives 2.9 its own bell, arced the other way with a rounded clapper, so it is
 * a separate icon rather than a normalised one.
 */

import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

export function BellQuiet({ size = 24, color = colors.ink, strokeWidth = 2.4 }: IconProps) {
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
      <Path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
      <Path d="M10.5 20a2 2 0 0 0 3 0" />
    </Svg>
  );
}
