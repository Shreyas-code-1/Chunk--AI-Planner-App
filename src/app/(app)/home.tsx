/**
 * 3.1 HOME.
 *
 * Every count is the planner's. The name and classes come from the onboarding
 * draft; the chunks, the progress and the minutes come from `usePlan`, which
 * runs the real algorithm over the work actually added. Nothing is drawn from
 * a fixed value, so an empty app shows zeros rather than the board's figures.
 *
 * TODO(design): the board draws no empty state for the UP NEXT card or the
 * classes list. 5.3 EMPTY STATE exists on the board and is not built yet, so
 * the gaps here render a plain line rather than an invented treatment.
 */

import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomDock, Chip } from '../../components/ui';
import { Bell, Flame } from '../../components/icons';
import { useDraft } from '../../features/onboarding/draft';
import { useDockNavigation } from '../../features/navigation/useDockNavigation';
import { timeLabel } from '../../lib/clock';
import { usePlan } from '../../features/work/usePlan';
import { useWork } from '../../features/work/store';
import { useLogs } from '../../features/logs/store';
import { LogIcon } from '../../features/logs/LogIcon';
import { UrgentHome, findUrgent } from '../../features/work/UrgentHome';
import { haptic } from '../../lib/haptics';
import { planDateOf, fromDateKey } from '../../lib/planDate';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

/** The board's "Wednesday, May 14". */
const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
};

export default function Home() {
  const router = useRouter();
  const dock = useDockNavigation('home');
  const displayName = useDraft((state) => state.displayName);
  const classes = useDraft((state) => state.classes);

  // The 03:00 boundary owns what "today" is; this only formats it.
  const today = fromDateKey(planDateOf(new Date()));

  const {
    upNext,
    doneToday,
    plannedToday,
    focusedToday,
    allTimeChunks,
    classes: progress,
    today: todayChunks,
    finishAtToday,
  } = usePlan();
  const logBalance = useLogs((state) => state.balance);
  const keptForLater = useWork((state) => state.keptForLater);
  const urgent = findUrgent(todayChunks, keptForLater, new Date());
  const chunksLeft = plannedToday - doneToday;

  // TODO(batch 6): a real streak needs completions that outlive the process.
  const streak = allTimeChunks > 0 ? 1 : 0;

  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{initials || '?'}</Text>
          </View>

          <View style={styles.greeting}>
            <Text style={styles.date}>{today.toLocaleDateString(undefined, DATE_FORMAT)}</Text>
            <Text style={styles.hello}>{displayName ? `Hi ${displayName}` : 'Hi there'}</Text>
          </View>

          <View style={styles.streak} accessibilityLabel={`${streak} day streak`}>
            <Flame size={16} />
            <Text style={styles.streakCount}>{streak}</Text>
          </View>

          <View style={styles.bell}>
            <Bell size={18} color={colors.mutedWarm} strokeWidth={2.4} />
            {/* The board's unread dot. Nothing sends a notification yet, so it
                is not drawn rather than drawn permanently. */}
          </View>
        </View>

        {urgent ? (
          <UrgentHome urgent={urgent} today={todayChunks} />
        ) : (
          <>
            <View style={[styles.says, shadows.hardEdge(7)]}>
              <View style={styles.saysText}>
                <Text style={styles.saysLabel}>
                  {chunksLeft === 0
                    ? 'CHUNK SAYS'
                    : `CHUNK SAYS · ${chunksLeft} ${chunksLeft === 1 ? 'CHUNK' : 'CHUNKS'} LEFT`}
                </Text>
                {/* The finish time is the most important string in the app (v3 §8). */}
                <Text style={styles.saysLine}>
                  {finishAtToday
                    ? `Done at ${timeLabel(finishAtToday)}`
                    : plannedToday > 0
                      ? 'All done for today'
                      : 'Nothing planned yet'}
                </Text>

                <View style={styles.segments}>
                  {Array.from({ length: Math.max(plannedToday, 5) }, (_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.segment,
                        index < doneToday ? styles.segmentOn : styles.segmentOff,
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.stats}>
              <Stat value={`${doneToday}/${plannedToday}`} label="today" />
              <Stat value={`${focusedToday}m`} label="focused" />
              <Stat value={`${allTimeChunks}`} label="all time" />
              <Stat value={`${logBalance}`} label="logs" icon={<LogIcon size={18} />} />
            </View>

            <Text style={styles.sectionLabel}>
              {upNext
                ? upNext.running
                  ? `ON NOW · SINCE ${timeLabel(upNext.scheduledStart)}`
                  : `NEXT UP AT ${timeLabel(upNext.scheduledStart)}`
                : 'UP NEXT'}
            </Text>

            {upNext ? (
              <View style={[styles.upNext, shadows.hardEdge(6)]}>
                <View style={styles.upNextRow}>
                  <Chip className={upNext.classId ?? 'Other'} size={48} />
                  <View style={styles.upNextText}>
                    <Text style={styles.upNextLabel}>
                      {`CHUNK ${todayChunks.indexOf(upNext) + 1} OF ${plannedToday}`}
                    </Text>
                    <Text style={styles.upNextTitle}>{upNext.title}</Text>
                    <Text style={styles.upNextMeta}>
                      {`${upNext.classId ?? 'No class'} · ${upNext.plannedMinutes} min`}
                    </Text>
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    haptic('press');
                    router.push({
                      pathname: '/focus',
                      params: {
                        chunk: upNext.key,
                        assignment: upNext.assignmentId,
                        title: upNext.title,
                        className: upNext.classId ?? '',
                        minutes: String(upNext.plannedMinutes),
                        index: String(todayChunks.indexOf(upNext) + 1),
                        total: String(plannedToday),
                      },
                    });
                  }}
                  style={[styles.start, shadows.hardEdge(5)]}
                >
                  <Text style={styles.startLabel}>START THIS CHUNK</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyLine}>
                  Nothing to start yet — add some work and Chunk will cut it up.
                </Text>
              </View>
            )}

            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>YOUR CLASSES</Text>
              {classes.length > 0 ? (
                <Pressable accessibilityRole="button" onPress={() => router.push('/all-work')}>
                  <Text style={styles.seeAll}>SEE ALL</Text>
                </Pressable>
              ) : null}
            </View>

            {classes.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyLine}>No classes yet.</Text>
              </View>
            ) : (
              <View style={styles.classList}>
                {classes.map((entry, index) => {
                  const row = progress.find((item) => item.className === entry.name);
                  const percent = row?.percent ?? 0;
                  return (
                    <View
                      key={`${entry.name}-${index}`}
                      style={[styles.classRow, shadows.hardEdge(5)]}
                    >
                      <Chip className={entry.name} />
                      <View style={styles.classText}>
                        <Text style={styles.className}>{entry.name}</Text>
                        <View style={styles.track}>
                          <View style={[styles.trackFill, { width: `${percent}%` }]} />
                        </View>
                      </View>
                      <Text style={styles.percent}>{`${percent}%`}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <BottomDock active="home" {...dock} />
    </SafeAreaView>
  );
}

function Stat({ value, label, icon }: { value: string; label: string; icon?: ReactNode }) {
  return (
    <View style={[styles.stat, shadows.hardEdge(5)]}>
      {/* Four tiles are narrower than the board's three; shrink rather than wrap. */}
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {/* The log tile shows the log in place of its label. */}
      {icon ? (
        <View style={styles.statIcon} accessibilityLabel={label}>
          {icon}
        </View>
      ) : (
        <Text style={styles.statLabel}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radii.mdAlt,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: { fontFamily: fonts.body.black, fontSize: 14, color: colors.orangeDeep },
  greeting: { flex: 1 },
  date: { fontFamily: fonts.body.bold, fontSize: 12, color: colors.muted },
  hello: {
    fontFamily: fonts.display.extraBold,
    fontSize: 24,
    lineHeight: displayLine(24, 1.1),
    color: colors.ink,
    includeFontPadding: false,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  streakCount: { fontFamily: fonts.body.black, fontSize: 12.5, color: colors.white },
  bell: {
    width: 42,
    height: 42,
    borderRadius: radii.mdAlt,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  says: {
    marginTop: 16,
    backgroundColor: colors.orange,
    borderRadius: radii.chip,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  saysText: { flex: 1 },
  saysLabel: {
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.12,
    color: 'rgba(255,255,255,0.85)',
  },
  saysLine: {
    marginTop: 3,
    fontFamily: fonts.display.bold,
    fontSize: 22,
    lineHeight: displayLine(22, 1.2),
    color: colors.white,
    includeFontPadding: false,
  },
  segments: { marginTop: 10, flexDirection: 'row', gap: 5 },
  segment: { flex: 1, height: 9, borderRadius: 5 },
  segmentOn: { backgroundColor: colors.white },
  segmentOff: { backgroundColor: 'rgba(255,255,255,0.35)' },

  stats: { marginTop: 16, flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: radii.xl,
    padding: 13,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.display.extraBold,
    fontSize: 24,
    lineHeight: displayLine(24, 1),
    color: colors.ink,
    includeFontPadding: false,
  },
  statIcon: { marginTop: 1 },
  statLabel: { marginTop: 3, fontFamily: fonts.body.extraBold, fontSize: 11, color: colors.muted },

  sectionRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    marginTop: 18,
    fontFamily: fonts.body.black,
    fontSize: 12,
    letterSpacing: 12 * 0.12,
    color: colors.mutedLight,
  },
  seeAll: { fontFamily: fonts.body.black, fontSize: 12.5, color: colors.orangeDeep },

  empty: {
    marginTop: 10,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: radii.xxl,
    padding: 18,
  },
  emptyLine: {
    fontFamily: fonts.body.bold,
    fontSize: 13.5,
    lineHeight: 13.5 * 1.45,
    color: colors.muted,
  },

  classList: { marginTop: 10, gap: 10 },
  classRow: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: radii.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  classText: { flex: 1 },
  className: { fontFamily: fonts.body.extraBold, fontSize: 15, color: colors.ink },
  track: {
    marginTop: 7,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  trackFill: { height: '100%', backgroundColor: colors.orange },
  percent: { fontFamily: fonts.display.extraBold, fontSize: 20, color: colors.orange },

  upNext: {
    marginTop: 10,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.orange,
    borderRadius: radii.chip - 2,
    padding: 18,
  },
  upNextRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  upNextText: { flex: 1 },
  upNextLabel: {
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.1,
    color: colors.orangeDeep,
  },
  upNextTitle: { marginTop: 2, fontFamily: fonts.body.extraBold, fontSize: 17, color: colors.ink },
  upNextMeta: {
    marginTop: 1,
    fontFamily: fonts.body.semiBold,
    fontSize: 12.5,
    color: colors.muted,
  },
  start: {
    marginTop: 14,
    backgroundColor: colors.orange,
    borderRadius: 18,
    padding: 15,
    alignItems: 'center',
  },
  startLabel: {
    fontFamily: fonts.body.black,
    fontSize: 14.5,
    letterSpacing: 14.5 * 0.08,
    color: colors.white,
  },

});
