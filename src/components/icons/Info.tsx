/**
 * Info icon. Inline explanation.
 *
 * Traced from design/board.html, not from an icon library. The board uses 2.4.
 * Stroke width and round caps are the board's and are never normalised.
 */

import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

export function Info({ size = 24, color = colors.ink, strokeWidth = 2.4 }: IconProps) {
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
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 8v.01M12 11.5V17" />
    </Svg>
  );
}
