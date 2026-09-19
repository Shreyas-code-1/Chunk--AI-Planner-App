/**
 * Placeholders for the board's stroked display text.
 *
 * React Native has no `-webkit-text-stroke` and no `paint-order`, and the
 * usual approximations — layered duplicate text, shadow rings — look wrong at
 * 40px and catastrophic at the splash's 104px. So none of this text is drawn:
 * each placeholder renders nothing until artwork lands in `design/assets/`.
 * See docs/stroked-elements.md for the six real occurrences and their values.
 *
 * What they do render is *space*. Each lays out a copy of its own text at the
 * real face, size and letter spacing with zero opacity, so the gap left behind
 * is the exact width and height the finished asset will occupy. That is what
 * lets the artwork drop in later without a single layout value changing — the
 * alternative, rendering nothing at all, would collapse the line and make
 * every surrounding measurement a lie that has to be redone twice.
 */

import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { colors, fonts, radii, shadows } from '../../theme/tokens';

type StrokedTextProps = {
  /** The words the asset will show. Used for spacing and for screen readers. */
  children: string;
  fontSize: number;
  letterSpacing?: number;
  lineHeight?: number;
  style?: StyleProp<TextStyle>;
};

/**
 * Bare stroked display text — the splash logo (element 1), which is the only
 * one of the six that is not inside a highlight chip.
 */
export function StrokedText({
  children,
  fontSize,
  letterSpacing,
  lineHeight,
  style,
}: StrokedTextProps) {
  return (
    <Text
      accessibilityLabel={children}
      style={[
        styles.reserved,
        { fontSize, letterSpacing, lineHeight: lineHeight ?? fontSize },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

type HighlightChipProps = {
  children: string;
  fontSize: number;
  /** `#F5931F` everywhere except the paywall's gold. */
  background?: string;
  /** The paywall's chip is the one with no hard edge beneath it. */
  edge?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * The highlight chip — elements 2 through 6.
 *
 * Unlike the splash logo this is only *half* a placeholder, and the split is
 * deliberate: the box is fully reproducible natively (fill, 3px ink border,
 * radius 16, the `0 5px 0` hard bottom edge) so it is drawn for real, and only
 * the stroked text inside it is held back. The chip therefore looks right on
 * device today apart from being empty.
 */
export function HighlightChip({
  children,
  fontSize,
  background = colors.orangeChip,
  edge = true,
  style,
}: HighlightChipProps) {
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: background },
        edge && shadows.hardEdge(5, colors.ink),
        style,
      ]}
    >
      <StrokedText fontSize={fontSize} lineHeight={fontSize * 1.15}>
        {children}
      </StrokedText>
    </View>
  );
}

const styles = StyleSheet.create({
  reserved: {
    fontFamily: fonts.display.extraBold,
    // Not `display: none` and not zero width: the text must still be measured
    // and laid out, it must simply not be seen.
    opacity: 0,
    color: colors.white,
  },
  chip: {
    // The board's `padding: 0 15px 2px`.
    paddingHorizontal: 15,
    paddingBottom: 2,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: radii.lg,
    alignSelf: 'flex-start',
  },
});
