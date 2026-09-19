/**
 * The stats strip on 3.1 HOME.
 *
 * A row of four figures, each a 22x22 marker beside a number. The markers are
 * flat shapes rather than icons on the board, and each stat has its own:
 *
 *   chunks today   orange square, radius 7
 *   all-time       cream circle with a 2px orange border
 *   minutes        brown square, radius 7
 *   finish rate    green square, radius 7
 *
 * The points spec is explicit that none of these may measure time in app or
 * sessions opened — every figure here is work actually finished.
 */

import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radii } from '../../theme/tokens';

export type StatKind = 'today' | 'allTime' | 'minutes' | 'rate';

export type Stat = {
  kind: StatKind;
  /** Pre-formatted: "12", "148", "21", "86%". */
  value: string;
  /** For screen readers, since the markers carry the meaning visually. */
  label: string;
};

const MARKERS: Record<StatKind, StyleProp<ViewStyle>> = {
  today: { backgroundColor: colors.orange, borderRadius: radii.sm },
  allTime: {
    backgroundColor: colors.amber,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.orange,
  },
  minutes: { backgroundColor: colors.statBrown, borderRadius: radii.sm },
  rate: { backgroundColor: colors.success, borderRadius: radii.sm },
};

export function StatsStrip({ stats, style }: { stats: Stat[]; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.strip, style]}>
      {stats.map((stat) => (
        <View key={stat.kind} style={styles.item} accessibilityLabel={`${stat.label}: ${stat.value}`}>
          <View style={[styles.marker, MARKERS[stat.kind]]} />
          <Text style={styles.value}>{stat.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: colors.page,
    borderWidth: 2,
    borderColor: colors.creamPale,
    borderRadius: radii.xxl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  marker: { width: 22, height: 22 },
  value: { fontFamily: fonts.body.black, fontSize: 15, color: colors.ink },
});
