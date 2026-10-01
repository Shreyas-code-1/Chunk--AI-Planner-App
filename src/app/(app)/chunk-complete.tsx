/**
 * 3.4 CHUNK COMPLETE.
 *
 * Reached from 3.3 when a chunk is finished, so the minutes and the position
 * in the day come through as parameters and are the real ones.
 *
 * Two things the board draws are deliberately absent. The encouraging line
 * ("That was the dense part of the chapter. Two easy ones left.") is written
 * about the specific chunk, which means it is model output, and §6 puts every
 * model call behind an Edge Function that does not exist — so the line is a
 * fixed one rather than a fabricated read of work nobody looked at. The
 * flashcards offer ("Want these notes as 18 flashcards?") names a count that
 * only 4.x can produce, and 4.3-4.5 are not built.
 *
 * TODO(batch 7): both of those return with the AI features.
 *
 * The completion itself is written by 3.3 before it navigates here, so every
 * count below is read back from the store rather than passed along. One place
 * owns whether a chunk is finished, and it is not this screen.
 */

import { Image, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui';
import { mascot } from '../../components/mascot';
import { SHORT_BREAK_MINUTES } from '../../planner/constants';
import { usePlan } from '../../features/work/usePlan';
import { useWork } from '../../features/work/store';
import { LogsEarned } from '../../features/logs/LogsEarned';
import { timeLabel } from '../../lib/clock';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

export default function ChunkComplete() {
  const router = useRouter();
  const params = useLocalSearchParams<{ minutes?: string; index?: string; logs?: string }>();

  const minutes = Number(params.minutes ?? 0);
  const index = Number(params.index ?? 0);
  const logs = Number(params.logs ?? 0);

  const { doneToday, plannedToday, allTimeChunks, upNext } = usePlan();
  // The chunk just finished; its end is "now" for the done line.
  const justFinished = useWork((state) => state.completions[state.completions.length - 1]);

  // TODO(batch 6): a real streak spans days, which the memory store cannot.
  const streak = allTimeChunks > 0 ? 1 : 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.body}>
        <View style={styles.middle}>
          <Image source={mascot.complete} style={styles.mascot} resizeMode="contain" />

          <View style={styles.copy}>
            <Text style={styles.headline}>
              {index > 0 ? `Chunk ${index} done!` : 'Chunk done!'}
            </Text>
            {/* v3 §8: when the next one starts, or that the evening is over. */}
            <Text style={styles.sub}>
              {upNext
                ? `Next chunk at ${timeLabel(upNext.scheduledStart)}.`
                : justFinished
                  ? `You're done. It's ${timeLabel(justFinished.endedAt)}.`
                  : 'That one is behind you. Take the win.'}
            </Text>
          </View>

          <LogsEarned logs={logs} />

          <View style={[styles.card, shadows.hardEdge(6)]}>
            <View style={styles.statRow}>
              <Stat value={`${minutes}`} label="MIN FOCUSED" />
              <View style={styles.divider} />
              <Stat value={`${doneToday}/${plannedToday}`} label="TODAY" />
              <View style={styles.divider} />
              <Stat value={`${streak}`} label="DAY STREAK" accent />
            </View>

            <View style={styles.segments}>
              {Array.from({ length: Math.max(plannedToday, 5) }, (_, position) => (
                <View
                  key={position}
                  style={[
                    styles.segment,
                    position < doneToday ? styles.segmentDone : styles.segmentTodo,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            label={`TAKE A ${SHORT_BREAK_MINUTES}-MIN BREAK`}
            onPress={() => router.replace('/home')}
          />
          <Button
            label={upNext ? 'STRAIGHT INTO THE NEXT ONE' : 'BACK TO TODAY'}
            variant="secondary"
            onPress={() =>
              upNext
                ? router.replace({
                    pathname: '/focus',
                    params: {
                      chunk: upNext.key,
                      assignment: upNext.assignmentId,
                      title: upNext.title,
                      className: upNext.classId ?? '',
                      minutes: String(upNext.plannedMinutes),
                      index: String(doneToday + 1),
                      total: String(plannedToday),
                    },
                  })
                : router.replace('/today')
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: { flex: 1, paddingHorizontal: 26, paddingTop: 20, paddingBottom: 32 },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 },
  mascot: { height: 200, width: 200 },
  copy: { alignItems: 'center' },
  headline: {
    fontFamily: fonts.display.extraBold,
    fontSize: 42,
    lineHeight: displayLine(42, 1.1),
    color: colors.ink,
    textAlign: 'center',
    includeFontPadding: false,
  },
  sub: {
    marginTop: 10,
    maxWidth: 280,
    fontFamily: fonts.body.bold,
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
  },

  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: radii.chip - 2,
    padding: 20,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: {
    fontFamily: fonts.display.extraBold,
    fontSize: 28,
    lineHeight: displayLine(28, 1),
    color: colors.ink,
    includeFontPadding: false,
  },
  statValueAccent: { color: colors.orange },
  statLabel: {
    marginTop: 3,
    fontFamily: fonts.body.extraBold,
    fontSize: 11,
    color: colors.muted,
  },
  divider: { width: 2, backgroundColor: colors.track },

  segments: { marginTop: 16, flexDirection: 'row', gap: 5 },
  segment: { flex: 1, height: 9, borderRadius: 5 },
  segmentDone: { backgroundColor: colors.success },
  segmentTodo: { backgroundColor: colors.track },

  actions: { gap: 12 },
});
