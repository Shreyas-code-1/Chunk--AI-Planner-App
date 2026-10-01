/**
 * Flame — the day-streak mark: a flame with a drop at its heart. Drawn from
 * the 30 Sep reference "Screenshot 2026-09-30 181747.png"; not on the board.
 * Filled, not stroked, so it ignores strokeWidth. `drop={false}` is the plain
 * flame on the v3 Profile overview.
 */

import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme/tokens';
import type { IconProps } from './types';

const FLAME =
  'M12.6 2.2c1.6 2.6 6.6 6.2 6.6 11.9a7.2 7.2 0 0 1-14.4 0c0-3.3.8-5.7 1.7-7.2.6 1.6 1.7 2.5 2.8 2.7-.2-3.2 1.3-5.6 3.3-7.4z';
const DROP = 'M12 10.6c1 1.5 3.1 3.2 3.1 5.3a3.1 3.1 0 0 1-6.2 0c0-2.1 2.1-3.8 3.1-5.3z';

export function Flame({
  size = 24,
  color = colors.orange,
  drop = true,
}: IconProps & { drop?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={FLAME} fill={color} />
      {drop ? <Path d={DROP} fill={colors.gold} /> : null}
    </Svg>
  );
}
