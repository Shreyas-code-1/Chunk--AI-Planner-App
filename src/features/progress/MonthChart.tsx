/**
 * HOURS PER MONTH on v3 5.1 PROGRESS (design/v3/progress.png): a dark card,
 * five bars, the current month in orange. Bars scale to the tallest month;
 * the tallest is 118pt, as drawn.
 *
 * TODO(design): no frame for a student with no hours yet — the bars collapse
 * to nothing and the labels read 0. Asked in
 * docs/v2-and-remaining-screens-questions.md.
 */

import { StyleSheet, Text, View } from 'react-native';

import type { MonthBar } from '../work/progress';
import { colors, fonts, radii, shadows } from '../../theme/tokens';

const MAX_BAR = 118;

const hoursText = (hours: number) => (Number.isInteger(hours) ? `${hours}` : hours.toFixed(1));

export function MonthChart({ months }: { months: MonthBar[] }) {
  const max = Math.max(0, ...months.map((m) => m.hours));
  return (
    <View style={[styles.card, shadows.hardEdge(6)]}>
      <Text style={styles.label}>HOURS PER MONTH</Text>
      <View style={styles.bars}>
        {months.map((month) => (
          <View key={month.key} style={styles.column} accessibilityLabel={`${month.label}: ${hoursText(month.hours)} hours`}>
            <Text style={[styles.value, month.isCurrent && styles.current]}>{hoursText(month.hours)}</Text>
            <View
              style={[
                styles.bar,
                { height: max === 0 ? 0 : (month.hours / max) * MAX_BAR },
                month.isCurrent && styles.barCurrent,
              ]}
            />
            <Text style={[styles.month, month.isCurrent && styles.current]}>{month.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16.5,
    minHeight: 218,
    backgroundColor: colors.darkCard,
    borderRadius: radii.xxl,
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  // The design wraps this onto two lines; the width reproduces it.
  label: {
    maxWidth: 100,
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    lineHeight: 16,
    letterSpacing: 11.5 * 0.12,
    color: colors.muted,
  },
  bars: { flexDirection: 'row', gap: 14, alignItems: 'flex-end' },
  column: { flex: 1, alignItems: 'center' },
  value: { marginBottom: 6, fontFamily: fonts.body.black, fontSize: 10.5, color: colors.muted },
  bar: { alignSelf: 'stretch', borderRadius: 10, backgroundColor: colors.white },
  barCurrent: { backgroundColor: colors.orange },
  month: { marginTop: 9, fontFamily: fonts.body.black, fontSize: 10.5, color: colors.muted },
  current: { color: colors.orange },
});
