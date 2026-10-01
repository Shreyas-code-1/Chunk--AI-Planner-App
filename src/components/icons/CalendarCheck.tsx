/**
 * CalendarCheck — "Finished on time" on v3 5.2 PROFILE. Not on the board;
 * drawn to match design/v3/profile.png.
 */

import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

export function CalendarCheck({
  size = 24,
  color = colors.calendarGreen,
  strokeWidth = 2.6,
}: IconProps) {
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
      <Rect x="3" y="4.5" width="18" height="17" rx="4" />
      <Path d="M3 9.5h18M8 2.5v4M16 2.5v4M8.5 15l2.5 2.5 4.5-4.5" />
    </Svg>
  );
}
