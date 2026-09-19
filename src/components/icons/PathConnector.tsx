/**
 * The dotted path connector on 3.2 TODAY — PATH.
 *
 * Not a 24x24 icon. It is a single serpentine stroke on its own 350x520
 * viewBox that threads down the page between the path nodes, drawn as a round
 * dashed line: 20px stroke, `stroke-dasharray: 2 26`, which with round caps
 * renders as dots rather than dashes.
 *
 * It scales with `preserveAspectRatio="none"` so it can stretch to however
 * many nodes a day happens to have — the curve's shape is decorative, so
 * stretching it is safe in a way that stretching an icon would not be.
 */

import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme/tokens';

type Props = {
  width?: number;
  height?: number;
  color?: string;
};

export function PathConnector({ width = 350, height = 520, color = colors.track }: Props) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 350 520"
      fill="none"
      preserveAspectRatio="none"
    >
      <Path
        d="M92 42 C92 108 258 108 258 174 C258 240 92 240 92 306 C92 372 258 372 258 438"
        stroke={color}
        strokeWidth={20}
        strokeLinecap="round"
        strokeDasharray="2 26"
      />
    </Svg>
  );
}
