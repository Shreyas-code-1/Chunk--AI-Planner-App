/**
 * The mascot's speech bubble.
 *
 * On the board this is always a mascot image and a bubble side by side, with
 * the bubble taking the remaining width and both bottom-aligned. The bubble
 * itself is a plain rounded rectangle — there is no tail drawn anywhere on the
 * board, so none is invented here.
 */

import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { colors, fonts, radii } from '../../theme/tokens';

type Props = {
  children: string;
  /** The mascot artwork; the caller picks the pose. */
  mascot?: ReactNode;
  /**
   * The board draws two sizes: the question bubble at the top of 2.3-2.5
   * (14.5px, padding 14/16) and a smaller aside at the foot of 2.6-2.8
   * (13.5px, padding 13/15).
   */
  size?: 'default' | 'compact';
  style?: StyleProp<ViewStyle>;
};

export function SpeechBubble({ children, mascot, size = 'default', style }: Props) {
  const compact = size === 'compact';
  return (
    <View style={[styles.row, style]}>
      {mascot}
      <View style={[styles.bubble, compact && styles.bubbleCompact]}>
        <Text style={[styles.text, compact && styles.textCompact]}>{children}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  bubble: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: radii.xl,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  bubbleCompact: {
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  text: {
    fontFamily: fonts.body.bold,
    fontSize: 14.5,
    color: colors.ink,
    lineHeight: 14.5 * 1.45,
  },
  textCompact: {
    fontSize: 13.5,
    lineHeight: 13.5 * 1.45,
  },
});
