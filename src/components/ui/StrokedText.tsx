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
 * real face, size and letter spacing, so the gap left behind is the exact
 * width and height the finished asset will occupy. That is what lets the
 * artwork drop in later without a single layout value changing — the
 * alternative, rendering nothing at all, would collapse the line and make
 * every surrounding measurement a lie that has to be redone twice.
 *
 * DRAFT_FILL below decides whether that reserved space is *visible*. With it
 * on, the words are drawn in plain fill with no stroke: wrong, but legible,
 * so the screen can be reviewed on a device. With it off they are invisible,
 * which is the honest state but makes a splash screen look broken and a
 * highlight chip look empty. It is one constant because it flips to `false`
 * the day the artwork lands, and nothing else changes.
 */

import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { colors, fonts, radii, shadows } from '../../theme/tokens';

/**
 * Draw the placeholder words in plain fill instead of leaving them invisible.
 *
 * `true` while the stroked artwork is outstanding — this is NOT the board's
 * treatment and must not be mistaken for it: there is no stroke, no paint
 * order and no hard drop shadow. Set to `false` (or delete the branch) once
 * design/assets/ is populated. See docs/stroked-elements.md.
 */
const DRAFT_FILL = true;

/**
 * Baloo 2 ExtraBold vertical metrics, in ems, read from the shipped TTF:
 * hhea ascent 1078, descent -524, OS/2 capHeight 602, all against a 1000 upem.
 */
const ASCENT = 1.078;
const DESCENT = 0.524;
const CAP_HEIGHT = 0.602;

/**
 * How far the word has to move down to sit optically centred in the chip.
 *
 * CSS spreads half-leading around the baseline; React Native instead centres
 * the whole ascent+descent box inside `lineHeight`. Baloo 2's ascent is more
 * than twice its descent, so the two disagree, and copying the board's
 * `padding: 0 15px 2px` straight across left the word riding high in the box
 * with a gap under it. This is the difference: cap + descent - ascent.
 */
const OPTICAL_SHIFT = CAP_HEIGHT + DESCENT - ASCENT;

/** The board's `padding: 0 15px 2px`, kept as a total so the chip keeps its height. */
const CHIP_PAD_Y = 2;

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
        !DRAFT_FILL && styles.hidden,
        {
          fontSize,
          letterSpacing,
          // The board's line-heights go below 1 (the splash is .95). CSS lets
          // the glyph overflow its line box; RN clips it. While the draft fill
          // is on screen, floor it so nothing is cut off.
          lineHeight: DRAFT_FILL
            ? Math.max(lineHeight ?? fontSize, fontSize * 1.2)
            : (lineHeight ?? fontSize),
        },
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
  /** `#FA7814` everywhere except the paywall's gold. */
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
  // Spend the board's 2px of vertical padding where the optics need it rather
  // than all of it under the word. Total is unchanged, so is the chip's height.
  const paddingTop = Math.min(CHIP_PAD_Y, Math.max(0, (CHIP_PAD_Y + fontSize * OPTICAL_SHIFT) / 2));

  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: background, paddingTop, paddingBottom: CHIP_PAD_Y - paddingTop },
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
    color: colors.white,
    textAlign: 'center',
    // Android otherwise pads the line from the font's bounding box, and Baloo
    // 2's is 2.295em tall — a whole extra em above the word, which shoves it
    // down inside the chip and off the line it is meant to sit on.
    includeFontPadding: false,
  },
  // Not `display: none` and not zero width: the text must still be measured
  // and laid out, it must simply not be seen.
  hidden: {
    opacity: 0,
  },
  chip: {
    // The board's `padding: 0 15px 2px`. The vertical half is applied per
    // instance above, because how it splits depends on the font size.
    paddingHorizontal: 15,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: radii.lg,
    alignSelf: 'flex-start',
  },
});
