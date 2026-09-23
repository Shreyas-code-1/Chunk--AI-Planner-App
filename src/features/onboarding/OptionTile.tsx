/**
 * The short, wide choice tile: a headline value with a word beneath it.
 *
 * 2.6 CHUNK LENGTH draws three. The selected one takes `flex: 1.25` — the
 * board widens a chosen tile rather than only recolouring it, the same move it
 * makes with 2.4's grade tiles at 1.15.
 */

import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { haptic } from '../../lib/haptics';
import { colors, fonts, radii, selectedOption, shadows } from '../../theme/tokens';

export function TileRow({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.row, style]}>{children}</View>;
}

type Props = {
  selected: boolean;
  onPress(): void;
  headline: string;
  caption?: string;
  accessibilityLabel?: string;
};

export function OptionTile({ selected, onPress, headline, caption, accessibilityLabel }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? headline}
      onPress={() => {
        haptic('select');
        onPress();
      }}
      style={[
        styles.tile,
        shadows.hardEdge(5),
        { flex: selected ? 1.25 : 1 },
        selected ? styles.on : styles.off,
      ]}
    >
      <Text style={[styles.headline, selected && styles.headlineOn]}>{headline}</Text>
      {caption ? (
        <Text style={[styles.caption, selected && styles.captionOn]}>{caption}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  tile: {
    borderWidth: 2,
    borderRadius: radii.xl,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  off: { backgroundColor: colors.card, borderColor: colors.cream },
  on: selectedOption,
  headline: {
    fontFamily: fonts.display.extraBold,
    fontSize: 24,
    textAlign: 'center',
    includeFontPadding: false,
    color: colors.mutedLine,
  },
  headlineOn: { color: colors.white },
  caption: {
    marginTop: 4,
    fontFamily: fonts.body.bold,
    fontSize: 11.5,
    color: colors.mutedLight,
  },
  captionOn: { fontFamily: fonts.body.extraBold, color: colors.white },
});
