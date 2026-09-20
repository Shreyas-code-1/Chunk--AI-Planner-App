/**
 * Envelope — "Continue with email" on 2.17.
 *
 * Traced from design/board.html.
 */

import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

export function Mail({ size = 24, color = colors.ink, strokeWidth = 2.4 }: IconProps) {
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
      <Rect x={2.5} y={4.5} width={19} height={15} rx={3} />
      <Path d="M3.5 7l8.5 6 8.5-6" />
    </Svg>
  );
}
