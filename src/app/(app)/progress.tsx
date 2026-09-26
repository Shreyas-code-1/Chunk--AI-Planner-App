/**
 * 5.1 PROGRESS — the dock's Focus tab.
 *
 * Every number is derived from completions. The board's "27 chunks done" is
 * read as this week's count, and "finish rate" as chunks finished out of the
 * chunks whose slot has passed.
 *
 * TODO(batch 6): completions are memory-only, so last week and the streak
 * only cover this session.
 */

import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomDock, Chip } from '../../components/ui';
import { mascot } from '../../components/mascot';
import { useDockNavigation } from '../../features/navigation/useDockNavigation';
import { useDraft } from '../../features/onboarding/draft';
import {
  clockLabel,
  hoursLabel,
  minutesByClass,
  week,
  weekStart,
  weekTotal,
} from '../../features/work/progress';
import { useWork } from '../../features/work/store';
import { usePlan } from '../../features/work/usePlan';
import { addDays, fromDateKey, planDateOf } from '../../lib/planDate';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

const DAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const RANGE: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

export default function Progress() {
  const dock = useDockNavigation('focus');
  const completions = useWork((s) => s.completions);
  const assignments = useWork((s) => s.assignments);
  const goal = useDraft((s) => s.dailyMinutes);
  const { all, allTimeChunks } = usePlan();

  const now = new Date();
  const today = planDateOf(now);
  const monday = weekStart(today);
  const days = week(completions, today);
  const thisWeek = weekTotal(completions, monday);
  const lastWeek = weekTotal(completions, addDays(monday, -7));
  const doneThisWeek = completions.filter((c) => planDateOf(c.endedAt) >= monday).length;

  // A chunk counts once its whole slot has passed, not the moment it starts.
  const due = all.filter(
    (c) => c.done || c.scheduledStart.getTime() + c.plannedMinutes * 60_000 <= now.getTime(),
  );
  const finishRate =
    due.length === 0 ? null : Math.round((due.filter((c) => c.done).length / due.length) * 100);

  const byClass = minutesByClass(completions, assignments);
  const classRows = [...byClass.entries()].sort((a, b) => b[1] - a[1]);
  const maxClass = Math.max(1, ...classRows.map(([, m]) => m));

  // TODO(batch 6): a real streak needs completions that outlive the process.
  const streak = allTimeChunks > 0 ? 1 : 0;
  const diff = thisWeek - lastWeek;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Progress</Text>
            <Text style={styles.range}>
              {`${fromDateKey(monday).toLocaleDateString(undefined, RANGE)} – ${fromDateKey(addDays(monday, 6)).getDate()}`}
            </Text>
          </View>
          <View style={styles.streak}>
            <View style={styles.streakDot} />
            <Text style={styles.streakLabel}>{`${streak}-day streak`}</Text>
          </View>
        </View>

        <View style={[styles.week, shadows.hardEdge(7)]}>
          <Image source={mascot.progress} style={styles.mascot} resizeMode="contain" />
          <View style={styles.flex}>
            <Text style={styles.weekLabel}>THIS WEEK</Text>
            <Text style={styles.weekValue}>{`${hoursLabel(thisWeek)} focused`}</Text>
            {lastWeek > 0 ? (
              <Text style={styles.weekMeta}>
                {`${diff >= 0 ? '+' : '−'}${hoursLabel(Math.abs(diff))} on last week`}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.chart}>
          <View style={styles.chartHead}>
            <Text style={styles.chartLabel}>TIME PER DAY</Text>
            <Text style={[styles.chartLabel, styles.goal]}>{`GOAL ${clockLabel(goal)}`}</Text>
          </View>
          <View style={styles.bars}>
            {days.map((day) => {
              const filled = Math.max(0.06, Math.min(1, day.minutes / (goal * 1.4)));
              return (
                <View key={day.planDate} style={styles.barCol}>
                  <View
                    style={[
                      styles.bar,
                      day.isFuture
                        ? styles.barFuture
                        : {
                            height: `${filled * 100}%`,
                            backgroundColor: day.isToday ? colors.orange : colors.white,
                          },
                    ]}
                  />
                  <Text style={[styles.barDay, day.isToday && styles.barDayToday]}>
                    {DAY_LETTER[fromDateKey(day.planDate).getDay()]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.stats}>
          <View style={[styles.stat, shadows.hardEdge(5)]}>
            <Text style={styles.statValue}>{doneThisWeek}</Text>
            <Text style={styles.statLabel}>chunks done</Text>
          </View>
          <View style={[styles.stat, shadows.hardEdge(5)]}>
            <Text style={[styles.statValue, styles.statGood]}>
              {finishRate == null ? '—' : `${finishRate}%`}
            </Text>
            <Text style={styles.statLabel}>finish rate</Text>
          </View>
        </View>

        {classRows.length > 0 ? (
          <>
            <Text style={styles.section}>BY CLASS</Text>
            <View style={styles.classes}>
              {classRows.map(([name, minutes]) => (
                <View key={name} style={styles.classRow}>
                  <Chip className={name} size={38} />
                  <View style={styles.flex}>
                    <View style={styles.classHead}>
                      <Text style={styles.className}>{name}</Text>
                      <Text style={styles.classTime}>{clockLabel(minutes)}</Text>
                    </View>
                    <View style={styles.track}>
                      <View
                        style={[styles.trackFill, { width: `${(minutes / maxClass) * 100}%` }]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <BottomDock active="focus" style={styles.dock} {...dock} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 },
  flex: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  title: {
    fontFamily: fonts.display.extraBold,
    fontSize: 28,
    lineHeight: displayLine(28, 1.1),
    color: colors.ink,
  },
  range: { fontFamily: fonts.body.bold, fontSize: 12.5, color: colors.muted },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.darkCard,
    borderRadius: radii.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  streakDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.orange },
  streakLabel: { fontFamily: fonts.body.black, fontSize: 12.5, color: colors.white },

  week: {
    marginTop: 14,
    backgroundColor: colors.orange,
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  mascot: { height: 76, width: 64 },
  weekLabel: {
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.12,
    color: 'rgba(255,255,255,0.85)',
  },
  weekValue: {
    fontFamily: fonts.display.extraBold,
    fontSize: 30,
    lineHeight: displayLine(30, 1.1),
    color: colors.white,
  },
  weekMeta: {
    marginTop: 2,
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.9)',
  },

  chart: { marginTop: 14, backgroundColor: colors.darkCard, borderRadius: 24, padding: 18 },
  chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  chartLabel: {
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.12,
    color: colors.mutedLight,
  },
  goal: { color: colors.orange },
  bars: { marginTop: 16, flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 112 },
  barCol: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  bar: { width: '100%', borderRadius: 8 },
  barFuture: { height: '18%', backgroundColor: 'rgba(255,255,255,0.28)' },
  barDay: { fontFamily: fonts.body.extraBold, fontSize: 10, color: colors.mutedLight },
  barDayToday: { fontFamily: fonts.body.black, color: colors.orange },

  stats: { marginTop: 14, flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.display.extraBold,
    fontSize: 30,
    lineHeight: displayLine(30, 1),
    color: colors.ink,
  },
  statGood: { color: colors.success },
  statLabel: {
    marginTop: 3,
    fontFamily: fonts.body.extraBold,
    fontSize: 11.5,
    color: colors.muted,
  },

  section: {
    marginTop: 16,
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.12,
    color: colors.mutedLight,
  },
  classes: { marginTop: 10, gap: 11, paddingBottom: 14 },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  classHead: { flexDirection: 'row', justifyContent: 'space-between' },
  className: { fontFamily: fonts.body.extraBold, fontSize: 13, color: colors.ink },
  classTime: { fontFamily: fonts.body.extraBold, fontSize: 13, color: colors.muted },
  track: {
    marginTop: 6,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  trackFill: { height: '100%', backgroundColor: colors.orange },

  dock: { marginHorizontal: 20, marginBottom: 10 },
});
