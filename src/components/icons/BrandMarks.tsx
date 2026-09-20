/**
 * Google and Apple wordmark glyphs for the 2.17 sign-in buttons.
 *
 * Kept apart from the rest of the icon set on purpose: these are other
 * companies' trademarks, reproduced from design/board.html because their
 * sign-in guidelines require their own mark. They are fixed artwork — neither
 * takes a colour prop, because recolouring either one would breach those
 * guidelines.
 */

import Svg, { Path } from 'react-native-svg';

export function GoogleMark({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.6-5.2 3.6-8.8z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z"
      />
      <Path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1z" />
      <Path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"
      />
    </Svg>
  );
}

export function AppleMark({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="#fff">
      <Path d="M16.7 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7 1.4 0 1.8.7 3 .7 1.2 0 2-1.1 2.8-2.2.6-.9.9-1.7 1.1-2.2-2.8-1-3.4-3.9-3.4-4.2zM14.9 5.4c.6-.8 1-1.8.9-2.9-.9.1-2 .6-2.7 1.4-.6.7-1 1.8-.9 2.8 1 .1 2-.5 2.7-1.3z" />
    </Svg>
  );
}
