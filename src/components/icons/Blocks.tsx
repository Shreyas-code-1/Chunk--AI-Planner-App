/**
 * Blocks — a square inside a square. "I don't know where to begin" on 2.9.
 *
 * Traced from design/board.html.
 */

import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

export function Blocks({ size = 24, color = colors.ink, strokeWidth = 2.4 }: IconProps) {
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
      <Path d="M4 4h16v16H4z" />
      <Path d="M8 8h8v8H8z" />
      <Path d="M12 12h0" />
    </Svg>
  );
}
