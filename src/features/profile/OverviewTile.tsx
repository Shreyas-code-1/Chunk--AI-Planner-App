/** One tile in v3 5.2's OVERVIEW grid: icon, value, label. 169x65, 5pt brown edge. */

import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

export function OverviewTile({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <View style={[styles.tile, shadows.hardEdge(5)]} accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.icon}>{icon}</View>
      <View style={styles.text}>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 65,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cream,
    borderRadius: radii.xl,
    paddingLeft: 13,
    paddingRight: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: { width: 24, alignItems: 'center', marginRight: 10 },
  text: { flex: 1 },
  value: {
    fontFamily: fonts.display.extraBold,
    fontSize: 20,
    lineHeight: displayLine(20, 1.15),
    color: colors.ink,
    includeFontPadding: false,
  },
  label: { fontFamily: fonts.body.extraBold, fontSize: 11, color: colors.muted },
});
