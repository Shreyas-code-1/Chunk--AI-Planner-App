/**
 * Microphone — "Say it out loud" on 2.13, and voice capture later.
 *
 * Traced from design/board.html.
 */

import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

export function Mic({ size = 24, color = colors.ink, strokeWidth = 2.3 }: IconProps) {
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
      <Rect x={9} y={3} width={6} height={11} rx={3} />
      <Path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
      <Path d="M12 18v3" />
    </Svg>
  );
}
