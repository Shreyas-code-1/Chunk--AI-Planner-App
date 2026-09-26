/**
 * 3.2 TODAY — PATH.
 *
 * The board draws four chunks on a winding dotted path: two done, one to
 * start, one locked. **There are no chunks.** §5 forbids drawing work that
 * does not exist, so the path renders what the plan holds, which today is
 * nothing.
 *
 * The path itself is the part that translates least directly. The board draws
 * it as one SVG cubic through fixed coordinates with the nodes positioned
 * absolutely on top. That is reproducible — `PathConnector` already exists —
 * but the curve is authored for exactly four nodes at exactly those points,
 * and a real day has between one and twelve. Laying out an N-node path is a
 * design question the board does not answer, so the nodes stack in order here
 * with the connector between them, and the S-curve is flagged rather than
 * faked at the wrong count.
 *
 * Engine v3 §8 puts the evening on the clock: every card leads with its start
 * time, finished ones with what really happened ("4:00 · 22m (said 25)"), and
 * the summary's big line is the finish time — the most important string in
 * the app. Breaks and the catch-up buffer sit between the cards as plain rows.
 * The first-action line is deliberately NOT here: v3 §7 allows it on Focus
 * only.
 *
 * TODO(design): break, buffer and pause rows have no frame; they reuse the
 * card meta type on the page background.
 * TODO(design): the S-curve for an arbitrary number of chunks.
 * TODO(design): no empty state is drawn for a day with nothing in it.
 */

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomDock, PathNode } from '../../components/ui';
import { useDockNavigation } from '../../features/navigation/useDockNavigation';
import { usePlan, type PlannedChunk } from '../../features/work/usePlan';
import { timeLabel } from '../../lib/clock';
import { planDateOf, fromDateKey, addDays } from '../../lib/planDate';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

/** The board's row of seven, Monday first. */
const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** "4:23 · Chem · 25 min", or for a finished chunk "4:00 · 22m (said 25)". */
function metaFor(chunk: PlannedChunk): string {
  const start = timeLabel(chunk.scheduledStart);
  if (chunk.done) {
    const actual = chunk.actualMinutes ?? chunk.plannedMinutes;
    return actual === chunk.plannedMinutes
      ? `${start} · ${actual}m`
      : `${start} · ${actual}m (said ${chunk.plannedMinutes})`;
  }
  const lead = chunk.running ? `On now since ${start}` : start;
  const pause = chunk.pauseAt ? ` · pause at ${timeLabel(chunk.pauseAt)}` : '';
  return `${lead} · ${chunk.classId ?? 'No class'} · ${chunk.plannedMinutes} min${pause}`;
}

export default function Today() {
  const router = useRouter();
  const dock = useDockNavigation('week');

  const todayKey = planDateOf(new Date());
  const today = fromDateKey(todayKey);
  // Monday of the current week, so the strip matches the board's M-to-S order.
  const mondayOffset = (today.getDay() + 6) % 7;
  const weekStart = addDays(todayKey, -mondayOffset);

  const {
    today: chunks,
    doneToday: done,
    upNext,
    breaksToday,
    finishAtToday,
    workEndToday,
    bufferToday,
  } = usePlan();
  const left = chunks.length - done;

  // Chunks and breaks in clock order; breaks carry no node.
  const rows = [
    ...chunks.map((chunk) => ({ at: chunk.scheduledStart.getTime(), chunk })),
    ...breaksToday.map((pause) => ({ at: pause.start.getTime(), pause })),
  ].sort((a, b) => a.at - b.at);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{"Today's path"}</Text>
          <View style={[styles.weekPill, shadows.hardEdge(4)]}>
            <Text style={styles.weekPillLabel}>WEEK</Text>
          </View>
        </View>

        <View style={styles.week}>
          {WEEKDAY_INITIALS.map((initial, index) => {
            const key = addDays(weekStart, index);
            const isToday = key === todayKey;
            return (
              <View
                key={key}
                style={[
                  styles.day,
                  isToday ? styles.dayOn : styles.dayOff,
                  isToday && shadows.hardEdge(4),
                ]}
              >
                <Text style={[styles.dayInitial, isToday && styles.dayInitialOn]}>{initial}</Text>
                <Text style={[styles.dayNumber, isToday && styles.dayNumberOn]}>
                  {fromDateKey(key).getDate()}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.summary, shadows.hardEdge(5)]}>
          <Text style={styles.summaryLabel}>
            {`${today.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase()} · ${done} DONE, ${left} TO GO`}
          </Text>
          <Text style={styles.summaryLine}>
            {chunks.length === 0
              ? 'Nothing planned'
              : finishAtToday
                ? `Done at ${timeLabel(finishAtToday)}`
                : 'All done for today'}
          </Text>
        </View>

        {chunks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyLine}>
              No chunks today. Add some work and Chunk will cut it into a path.
            </Text>
          </View>
        ) : (
          <View style={styles.path}>
            {rows.map((row) => {
              if ('pause' in row && row.pause) {
                return (
                  <Text key={`break-${row.at}`} style={styles.gapRow}>
                    {`${timeLabel(row.pause.start)}   Break · ${row.pause.minutes} min`}
                  </Text>
                );
              }
              const chunk = (row as { chunk: (typeof chunks)[number] }).chunk;
              const position = chunks.indexOf(chunk);
              // The board's three states, derived rather than stored: finished,
              // the first unfinished one, and everything behind it.
              const state = chunk.done ? 'done' : upNext?.key === chunk.key ? 'now' : 'locked';

              return (
                <View key={chunk.key} style={styles.pathRow}>
                  <PathNode
                    state={state}
                    onPress={
                      state === 'now'
                        ? () =>
                            router.push({
                              pathname: '/focus',
                              params: {
                                chunk: chunk.key,
                                assignment: chunk.assignmentId,
                                title: chunk.title,
                                className: chunk.classId ?? '',
                                minutes: String(chunk.plannedMinutes),
                                index: String(position + 1),
                                total: String(chunks.length),
                              },
                            })
                        : undefined
                    }
                  />
                  <View
                    style={[
                      styles.card,
                      state === 'now' ? styles.cardNow : styles.cardPlain,
                      shadows.hardEdge(state === 'now' ? 5 : 4),
                    ]}
                  >
                    <Text style={[styles.cardTitle, state === 'locked' && styles.dim]}>
                      {chunk.title}
                    </Text>
                    <Text
                      style={[
                        styles.cardMeta,
                        state === 'now' && styles.cardMetaNow,
                        state === 'locked' && styles.dimmer,
                      ]}
                    >
                      {metaFor(chunk)}
                    </Text>
                  </View>
                </View>
              );
            })}
            {workEndToday && bufferToday > 0 ? (
              <Text style={styles.gapRow}>
                {`${timeLabel(workEndToday)}   Catch-up time · ${bufferToday} min`}
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      <BottomDock active="week" style={styles.dock} {...dock} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 },

  headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  title: {
    fontFamily: fonts.display.extraBold,
    fontSize: 28,
    lineHeight: displayLine(28, 1.1),
    color: colors.ink,
    includeFontPadding: false,
  },
  weekPill: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  weekPillLabel: { fontFamily: fonts.body.black, fontSize: 12, color: colors.mutedWarm },

  week: { marginTop: 12, flexDirection: 'row', gap: 6 },
  day: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 14 },
  dayOff: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.cream },
  // The board widens today's cell rather than only recolouring it.
  dayOn: { flex: 1.25, backgroundColor: colors.orange },
  dayInitial: { fontFamily: fonts.body.extraBold, fontSize: 10, color: colors.mutedLight },
  dayInitialOn: { color: 'rgba(255,255,255,0.85)' },
  dayNumber: { marginTop: 2, fontFamily: fonts.body.black, fontSize: 14, color: colors.ink },
  dayNumberOn: { color: colors.white },

  summary: {
    marginTop: 12,
    backgroundColor: colors.orange,
    borderRadius: radii.xl,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  summaryLabel: {
    fontFamily: fonts.body.black,
    fontSize: 11,
    letterSpacing: 11 * 0.12,
    color: 'rgba(255,255,255,0.85)',
  },
  summaryLine: {
    fontFamily: fonts.display.bold,
    fontSize: 19,
    lineHeight: displayLine(19, 1.2),
    color: colors.white,
    includeFontPadding: false,
  },

  path: { marginTop: 16, gap: 14 },
  pathRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 13,
  },
  cardPlain: { borderWidth: 2, borderColor: colors.cream },
  cardNow: { borderWidth: 2, borderColor: colors.orange },
  cardTitle: { fontFamily: fonts.body.extraBold, fontSize: 13.5, color: colors.ink },
  cardMeta: { marginTop: 1, fontFamily: fonts.body.bold, fontSize: 11.5, color: colors.muted },
  cardMetaNow: { color: colors.orangeDeep },
  dim: { color: colors.muted },
  gapRow: {
    marginLeft: 74,
    fontFamily: fonts.body.bold,
    fontSize: 11.5,
    color: colors.mutedLight,
  },
  dimmer: { color: colors.mutedLight },

  empty: {
    marginTop: 16,
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

  dock: { marginHorizontal: 20, marginBottom: 10 },
});
