/**
 * 5.1 PROGRESS — the dock's stopwatch tab, v3 design (design/v3/progress.png).
 *
 * All time, not this week. Every figure is real (`useProgressStats`); the
 * design's are samples. "Finish rate" is chunks finished out of the chunks
 * whose slot has passed; "done on time" is assignments finished before their
 * due date out of those finished or past due.
 *
 * TODO(design): no frame for a brand-new student; empty values read "–".
 */

import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '../../components/ui/AppImage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { mascot } from '../../components/mascot';
import { LogIcon } from '../../features/logs/LogIcon';
import { durationLabel } from '../../features/work/progress';
import { useProgressStats } from '../../features/work/useProgressStats';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

const SINCE: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };

export default function Progress() {
  const stats = useProgressStats();
  const { onTime } = stats;
  const share = onTime.total === 0 ? 0 : onTime.onTime / onTime.total;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>
          {stats.since ? `All time · since ${stats.since.toLocaleDateString(undefined, SINCE)}` : 'All time'}
        </Text>

        <View style={[styles.card, styles.focused, shadows.hardEdge(5)]}>
          <View style={styles.focusedText}>
            <Text style={styles.label}>FOCUSED ALL TIME</Text>
            <Text style={styles.big} numberOfLines={1} adjustsFontSizeToFit>
              {durationLabel(stats.focused)}
            </Text>
            <Text style={styles.across}>{`Across ${stats.allTimeChunks} ${stats.allTimeChunks === 1 ? 'chunk' : 'chunks'}`}</Text>
          </View>
          <AppImage source={mascot.progress} style={styles.mascot} resizeMode="contain" />
        </View>

        <View style={styles.tiles}>
          <Tile value={`${stats.allTimeChunks}`} label="chunks done" />
          <Tile value={`${stats.logsEarned}`} label="logs earned" icon />
          <Tile value={stats.finishRate == null ? '–' : `${stats.finishRate}%`} label="finish rate" green />
        </View>

        <View style={[styles.card, styles.onTime, shadows.hardEdge(5)]}>
          <Text style={styles.label}>DONE ON TIME</Text>
          <View style={styles.onTimeRow}>
            <Text style={styles.onTimeValue}>{`${onTime.onTime} of ${onTime.total}`}</Text>
            <Text style={styles.onTimeCaption}>finished before the due date</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${share * 100}%` }]} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Tile({ value, label, icon, green }: { value: string; label: string; icon?: boolean; green?: boolean }) {
  return (
    <View style={[styles.card, styles.tile, shadows.hardEdge(5)]} accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.tileValueRow}>
        {icon ? <LogIcon size={20} /> : null}
        <Text style={[styles.tileValue, green && styles.green]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: { paddingHorizontal: 21, paddingTop: 2, paddingBottom: 24 },
  title: {
    fontFamily: fonts.display.extraBold,
    fontSize: 28,
    lineHeight: displayLine(28, 1.1),
    color: colors.ink,
    includeFontPadding: false,
  },
  subtitle: { marginTop: 2, fontFamily: fonts.body.bold, fontSize: 12.5, color: colors.subtle },

  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cream },
  label: {
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.12,
    color: colors.mutedLight,
  },

  focused: {
    marginTop: 16,
    minHeight: 122,
    borderRadius: radii.chip,
    paddingHorizontal: 19,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusedText: { flex: 1, marginRight: 8 },
  big: {
    marginTop: 4,
    fontFamily: fonts.display.extraBold,
    fontSize: 36,
    lineHeight: displayLine(36, 1.1),
    color: colors.ink,
    includeFontPadding: false,
  },
  across: { marginTop: 4, fontFamily: fonts.body.extraBold, fontSize: 12.5, color: colors.success },
  mascot: { width: 103, height: 83.5 },

  tiles: { marginTop: 18.5, flexDirection: 'row', gap: 10 },
  tile: { flex: 1, height: 77, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  tileValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tileValue: {
    fontFamily: fonts.display.extraBold,
    fontSize: 28,
    lineHeight: displayLine(28, 1.05),
    color: colors.ink,
    includeFontPadding: false,
  },
  green: { color: colors.success },
  tileLabel: { marginTop: 2, fontFamily: fonts.body.extraBold, fontSize: 11, color: colors.muted },

  onTime: { marginTop: 17.5, borderRadius: radii.chip, paddingHorizontal: 19, paddingTop: 19, paddingBottom: 16 },
  onTimeRow: { marginTop: 6, flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
  onTimeValue: {
    fontFamily: fonts.display.extraBold,
    fontSize: 30,
    lineHeight: displayLine(30, 1.1),
    color: colors.ink,
    includeFontPadding: false,
  },
  onTimeCaption: {
    flex: 1,
    marginBottom: 2,
    fontFamily: fonts.body.bold,
    fontSize: 13,
    lineHeight: 18.5,
    color: colors.muted,
  },
  track: { marginTop: 8, height: 12, borderRadius: 6, backgroundColor: colors.cream, overflow: 'hidden' },
  fill: { height: 12, borderRadius: 6, backgroundColor: colors.success },
});
