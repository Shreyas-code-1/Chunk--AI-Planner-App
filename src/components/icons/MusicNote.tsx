/**
 * MusicNote icon. Ambient sound during a focus session (3.3).
 *
 * Traced from design/board.html, not from an icon library. The board uses 2.2.
 * Stroke width and round caps are the board's and are never normalised.
 */

import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

export function MusicNote({ size = 24, color = colors.ink, strokeWidth = 2.2 }: IconProps) {
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
      <Circle cx="7" cy="18" r="2.6" />
      <Circle cx="18" cy="15.5" r="2.6" />
      <Path d="M9.6 18V7l11-2v10.5" />
    </Svg>
  );
}
