/**
 * 5.4 URGENT DEADLINE — Home's body when unfinished work is due within
 * URGENT_WITHIN_HOURS (Q16). The board draws one card, so only the soonest
 * urgent assignment gets it.
 *
 * MOVE TO keeps the chunk at its planned time and puts Home back to normal.
 * It is only offered when the planned time is actually later.
 */

import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Chip } from '../../components/ui';
import { mascot } from '../../components/mascot';
import { haptic } from '../../lib/haptics';
import { URGENT_WITHIN_HOURS } from '../../planner/constants';
import { colors, fonts, shadows } from '../../theme/tokens';
import { hoursLabel } from './progress';
import { useWork } from './store';
import type { PlannedChunk } from './usePlan';

const TIME: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };

/** The soonest-due unfinished chunk inside the urgent window, unless kept for later. */
export function findUrgent(today: PlannedChunk[], kept: string[], now: Date): PlannedChunk | null {
  const limit = now.getTime() + URGENT_WITHIN_HOURS * 3_600_000;
  const candidates = today.filter(
    (c) => !c.done && c.dueAt.getTime() <= limit && !kept.includes(c.key),
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => (b.dueAt < a.dueAt ? b : a));
}

function dueIn(dueAt: Date, now: Date): string {
  const minutes = Math.max(0, Math.round((dueAt.getTime() - now.getTime()) / 60_000));
  if (minutes < 60) return `DUE IN ${minutes} MIN`;
  const hours = Math.round(minutes / 60);
  return `DUE IN ${hours} ${hours === 1 ? 'HOUR' : 'HOURS'}`;
}

export function UrgentHome({ urgent, today }: { urgent: PlannedChunk; today: PlannedChunk[] }) {
  const router = useRouter();
  const keepForLater = useWork((s) => s.keepForLater);
  const now = new Date();

  const sameTask = today.filter((c) => !c.done && c.assignmentId === urgent.assignmentId);
  const rest = today.filter((c) => !c.done && c.assignmentId !== urgent.assignmentId);
  const laterSlot = urgent.scheduledStart.getTime() > now.getTime() + 15 * 60_000;
  const count = sameTask.length;

  const start = (chunk: PlannedChunk) => {
    haptic('press');
    router.push({
      pathname: '/focus',
      params: {
        chunk: chunk.key,
        assignment: chunk.assignmentId,
        title: chunk.title,
        className: chunk.classId ?? '',
        minutes: String(chunk.plannedMinutes),
        index: String(chunk.index),
        total: String(count),
      },
    });
  };

  return (
    <>
      <View style={[styles.urgent, shadows.hardEdge(7, colors.urgentEdge)]}>
        <View style={styles.flag}>
          <View style={styles.flagDot} />
          <Text style={styles.flagLabel}>{dueIn(urgent.dueAt, now)}</Text>
        </View>
        <Text style={styles.title}>
          {urgent.classId ? `${urgent.classId} · ${urgent.title}` : urgent.title}
        </Text>
        <Text style={styles.line}>
          {`${count === 1 ? 'One' : count} ${urgent.plannedMinutes}-minute ${count === 1 ? 'chunk' : 'chunks'}.`}
          {laterSlot ? " There's a gap right now if you want it gone." : ''}
        </Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => start(urgent)}
            style={[styles.now, shadows.hardEdge(5, 'rgba(0,0,0,0.14)')]}
          >
            <Text style={styles.nowLabel}>DO IT NOW</Text>
          </Pressable>
          {laterSlot ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                haptic('select');
                keepForLater(urgent.key);
              }}
              style={styles.later}
            >
              <Text style={styles.laterLabel}>
                {`MOVE TO ${urgent.scheduledStart.toLocaleTimeString(undefined, TIME).toUpperCase()}`}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {rest.length > 0 ? (
        <>
          <View style={[styles.after, shadows.hardEdge(7)]}>
            <Image source={mascot.urgent} style={styles.mascot} resizeMode="contain" />
            <View style={styles.flex}>
              <Text style={styles.afterLabel}>AFTER THAT</Text>
              <Text style={styles.afterValue}>
                {`${rest.length} ${rest.length === 1 ? 'chunk' : 'chunks'} · ${hoursLabel(
                  rest.reduce((t, c) => t + c.plannedMinutes, 0),
                )}`}
              </Text>
            </View>
          </View>

          <Text style={styles.section}>{"STILL ON TODAY'S PATH"}</Text>
          <View style={styles.list}>
            {rest.map((chunk) => (
              <View key={chunk.key} style={[styles.row, shadows.hardEdge(5)]}>
                <Chip className={chunk.classId ?? 'Other'} />
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>{chunk.title}</Text>
                  <Text style={styles.rowMeta}>
                    {`Chunk ${chunk.index} · ${chunk.plannedMinutes} min`}
                  </Text>
                </View>
                <Text style={styles.rowTime}>
                  {chunk.scheduledStart.toLocaleTimeString(undefined, TIME)}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  urgent: { marginTop: 16, backgroundColor: colors.urgent, borderRadius: 26, padding: 18 },
  flag: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  flagDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.white },
  flagLabel: {
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.12,
    color: colors.white,
  },
  title: {
    marginTop: 8,
    fontFamily: fonts.display.bold,
    fontSize: 24,
    lineHeight: 24 * 1.2,
    color: colors.white,
  },
  line: {
    marginTop: 4,
    fontFamily: fonts.body.bold,
    fontSize: 13.5,
    lineHeight: 13.5 * 1.45,
    color: 'rgba(255,255,255,0.92)',
  },
  actions: { marginTop: 14, flexDirection: 'row', gap: 10 },
  now: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 13,
    alignItems: 'center',
  },
  nowLabel: {
    fontFamily: fonts.body.black,
    fontSize: 13.5,
    letterSpacing: 13.5 * 0.06,
    color: colors.urgentDeep,
  },
  later: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 16,
    padding: 13,
    alignItems: 'center',
  },
  laterLabel: {
    fontFamily: fonts.body.black,
    fontSize: 13.5,
    letterSpacing: 13.5 * 0.06,
    color: colors.white,
  },

  after: {
    marginTop: 14,
    backgroundColor: colors.orange,
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  mascot: { height: 72, width: 60 },
  afterLabel: {
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.12,
    color: 'rgba(255,255,255,0.85)',
  },
  afterValue: {
    marginTop: 2,
    fontFamily: fonts.display.bold,
    fontSize: 21,
    lineHeight: 21 * 1.2,
    color: colors.white,
  },

  section: {
    marginTop: 16,
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.12,
    color: colors.mutedLight,
  },
  list: { marginTop: 10, gap: 10 },
  row: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowTitle: { fontFamily: fonts.body.extraBold, fontSize: 14.5, color: colors.ink },
  rowMeta: { marginTop: 1, fontFamily: fonts.body.semiBold, fontSize: 12, color: colors.muted },
  rowTime: { fontFamily: fonts.body.black, fontSize: 13, color: colors.muted },
});
