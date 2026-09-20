/**
 * 3.1 HOME.
 *
 * The board draws this frame full: "Hi Maya", 3 chunks left, 2/5 today, 55m
 * focused, 148 all time, an UP NEXT card and two classes at 60% and 35%.
 * **None of that is drawn here.** §5 forbids faking numbers, the planner has
 * nothing in it, and there is no assignment to chunk yet — so every count is
 * the real one, which today is zero.
 *
 * The name and the classes come from the onboarding draft, which is the only
 * real data the app currently holds. The draft is not persisted, so a cold
 * start shows the signed-out shape of this screen rather than stale answers.
 *
 * TODO(design): the board draws no empty state for the UP NEXT card or the
 * classes list. 5.3 EMPTY STATE exists on the board and is not built yet, so
 * the gaps here render a plain line rather than an invented treatment.
 */

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomDock, Chip } from '../../components/ui';
import { Bell } from '../../components/icons';
import { useDraft } from '../../features/onboarding/draft';
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
  const displayName = useDraft((state) => state.displayName);
  const classes = useDraft((state) => state.classes);

  // The 03:00 boundary owns what "today" is; this only formats it.
  const today = fromDateKey(planDateOf(new Date()));

  // TODO(batch 5): every one of these comes from a plan that does not exist.
  const chunksLeft = 0;
  const doneToday = 0;
  const plannedToday = 0;
  const focusedMinutes = 0;
  const allTimeChunks = 0;
  const streak = 0;

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
            <View style={styles.streakDot} />
            <Text style={styles.streakCount}>{streak}</Text>
          </View>

          <View style={styles.bell}>
            <Bell size={18} color={colors.mutedWarm} strokeWidth={2.4} />
            {/* The board's unread dot. Nothing sends a notification yet, so it
                is not drawn rather than drawn permanently. */}
          </View>
        </View>

        <View style={[styles.says, shadows.hardEdge(7)]}>
          <View style={styles.saysText}>
            <Text style={styles.saysLabel}>CHUNK SAYS</Text>
            <Text style={styles.saysLine}>
              {chunksLeft === 0
                ? 'Nothing planned yet'
                : `${chunksLeft} ${chunksLeft === 1 ? 'chunk' : 'chunks'} left`}
            </Text>

            <View style={styles.segments}>
              {Array.from({ length: Math.max(plannedToday, 5) }, (_, index) => (
                <View
                  key={index}
                  style={[styles.segment, index < doneToday ? styles.segmentOn : styles.segmentOff]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.stats}>
          <Stat value={`${doneToday}/${plannedToday}`} label="today" />
          <Stat value={`${focusedMinutes}m`} label="focused" />
          <Stat value={`${allTimeChunks}`} label="all time" />
        </View>

        <Text style={styles.sectionLabel}>UP NEXT</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyLine}>
            Nothing to start yet — add some work and Chunk will cut it up.
          </Text>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>YOUR CLASSES</Text>
          {classes.length > 0 ? <Text style={styles.seeAll}>SEE ALL</Text> : null}
        </View>

        {classes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyLine}>No classes yet.</Text>
          </View>
        ) : (
          <View style={styles.classList}>
            {classes.map((entry, index) => (
              <View key={`${entry.name}-${index}`} style={[styles.classRow, shadows.hardEdge(5)]}>
                <Chip className={entry.name} />
                <View style={styles.classText}>
                  <Text style={styles.className}>{entry.name}</Text>
                  {/* 0% until chunks exist to complete. */}
                  <View style={styles.track}>
                    <View style={[styles.trackFill, { width: '0%' }]} />
                  </View>
                </View>
                <Text style={styles.percent}>0%</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomDock
        active="home"
        style={styles.dock}
        onSelect={(tab) => {
          // TODO(batch 5): only 3.2 exists. 3.3 is reached from a chunk, and
          // 5.2 PROFILE is not built.
          if (tab === 'week') router.push('/today');
        }}
        onAdd={() => {
          // TODO(batch 5): 3.6 ADD ASSIGNMENT is not built.
        }}
      />
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={[styles.stat, shadows.hardEdge(5)]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  streakDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.orange },
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

  dock: { marginHorizontal: 20, marginBottom: 10 },
});
