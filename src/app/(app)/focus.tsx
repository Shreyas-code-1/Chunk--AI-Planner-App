/**
 * 3.3 FOCUS — RUNNING.
 *
 * The one screen on the orange gradient. It is reached from a chunk, so it
 * takes that chunk's title, class and length as parameters rather than
 * inventing them: with nothing to focus on there is nothing to run, and the
 * screen says so instead of counting down against a made-up task.
 *
 * The timer is real. It counts the chunk's own minutes, and the ring is the
 * fraction of them elapsed, so nothing here is drawn from a fixed value the
 * way the board's 18:42 of 24 min is.
 *
 * TODO(design): the board draws no paused state, only PAUSE as a label.
 * TODO(batch 7): the music card does nothing. `expo-audio` is installed but
 * there is no track, no picker and no answer about where audio comes from.
 * Finishing records a completion against the chunk's key, which is what makes
 * 3.1's counters, 3.2's path and 3.5's progress move. That write is
 * append-only and idempotent for the same reason the `chunk_completions`
 * policy is: the lifetime count depends on it.
 */

import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrangeGradient, ProgressRing } from '../../components/ui';
import { useWork } from '../../features/work/store';
import { Close, MoreVertical, MusicNote } from '../../components/icons';
import { mascot } from '../../components/mascot';
import { haptic } from '../../lib/haptics';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

const CYCLES = 5;

/** mm:ss, which is what the board draws and what a countdown needs. */
function clock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function Focus() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    chunk?: string;
    assignment?: string;
    title?: string;
    className?: string;
    minutes?: string;
    index?: string;
    total?: string;
  }>();
  const completeChunk = useWork((state) => state.completeChunk);

  const minutes = Number(params.minutes ?? 0);
  const totalSeconds = Math.max(0, Math.round(minutes * 60));

  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(totalSeconds > 0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          // Stopping here rather than in a second effect: the interval is the
          // thing that reached zero, so it is the thing that stands itself down.
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [running]);

  const elapsed = totalSeconds === 0 ? 0 : (totalSeconds - remaining) / totalSeconds;
  const cyclesDone = Math.floor(elapsed * CYCLES);

  return (
    <View style={styles.screen}>
      <OrangeGradient />
      <StatusBar style="light" />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Leave the session"
            onPress={() => {
              haptic('select');
              router.back();
            }}
            style={styles.headerButton}
          >
            <Close size={18} color={colors.white} strokeWidth={2.6} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Focus session</Text>
            <Text style={styles.headerMeta}>
              {params.className && params.index && params.total
                ? `${params.className} · chunk ${params.index} of ${params.total}`
                : 'Nothing running'}
            </Text>
          </View>

          <View style={styles.headerButton}>
            <MoreVertical size={18} color={colors.white} strokeWidth={2.6} />
          </View>
        </View>

        <View style={styles.ringRow}>
          <ProgressRing
            progress={elapsed}
            size={276}
            color={colors.white}
            trackColor="rgba(255,255,255,0.32)"
          >
            <Text style={styles.ringLabel}>TIME LEFT</Text>
            <Text style={styles.ringClock}>{clock(remaining)}</Text>
            <View style={styles.ringOf}>
              <Text style={styles.ringOfLabel}>{`of ${minutes || 0} min`}</Text>
            </View>
          </ProgressRing>
        </View>

        <View style={[styles.chunkCard, shadows.hardEdge(6, 'rgba(0,0,0,0.12)')]}>
          <Text style={styles.chunkLabel}>THIS CHUNK</Text>
          <Text style={styles.chunkTitle}>{params.title ?? 'No chunk selected'}</Text>
          <Text style={styles.chunkHint}>
            {params.title
              ? 'Mark the cycles as you go.'
              : 'Start a chunk from your path and it will run here.'}
          </Text>

          <View style={styles.cycles}>
            {Array.from({ length: CYCLES }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.cycle,
                  index < cyclesDone
                    ? styles.cycleDone
                    : index === cyclesDone && running
                      ? styles.cycleNow
                      : styles.cycleTodo,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.art}>
          <Image source={mascot.focus} style={styles.mascot} resizeMode="contain" />
        </View>

        <View style={styles.footer}>
          <View style={styles.music}>
            <View style={styles.musicIcon}>
              <MusicNote size={18} color={colors.white} strokeWidth={2.4} />
            </View>
            <View style={styles.musicText}>
              <Text style={styles.musicTitle}>No track</Text>
              <Text style={styles.musicMeta}>Audio is not wired up yet</Text>
            </View>
          </View>

          <View style={styles.buttons}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                haptic('press');
                setRunning((value) => !value);
              }}
              disabled={totalSeconds === 0}
              style={styles.pause}
            >
              <Text style={styles.pauseLabel}>{running ? 'PAUSE' : 'RESUME'}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                haptic('press');
                const focused = Math.max(1, Math.round((totalSeconds - remaining) / 60));

                if (params.chunk && params.assignment) {
                  completeChunk({
                    chunkKey: params.chunk,
                    assignmentId: params.assignment,
                    minutes: focused,
                  });
                }

                router.replace({
                  pathname: '/chunk-complete',
                  params: {
                    minutes: String(focused),
                    index: params.index ?? '',
                    total: params.total ?? '',
                  },
                });
              }}
              style={[styles.finish, shadows.hardEdge(6, 'rgba(0,0,0,0.14)')]}
            >
              <Text style={styles.finishLabel}>FINISH CHUNK</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 24 },

  headerRow: {
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: radii.mdAlt,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { alignItems: 'center' },
  headerTitle: { fontFamily: fonts.body.black, fontSize: 15, color: colors.white },
  headerMeta: {
    fontFamily: fonts.body.bold,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.85)',
  },

  ringRow: { marginTop: 26, alignItems: 'center' },
  ringLabel: {
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.14,
    color: 'rgba(255,255,255,0.85)',
  },
  ringClock: {
    fontFamily: fonts.display.extraBold,
    fontSize: 66,
    lineHeight: displayLine(66, 1.1),
    color: colors.white,
    includeFontPadding: false,
  },
  ringOf: {
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 13,
  },
  ringOfLabel: { fontFamily: fonts.body.black, fontSize: 11.5, color: colors.white },

  chunkCard: {
    marginTop: 22,
    backgroundColor: colors.card,
    borderRadius: radii.chip - 2,
    padding: 18,
  },
  chunkLabel: {
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.12,
    color: colors.orangeDeep,
  },
  chunkTitle: {
    marginTop: 4,
    fontFamily: fonts.display.bold,
    fontSize: 24,
    lineHeight: displayLine(24, 1.2),
    color: colors.ink,
    includeFontPadding: false,
  },
  chunkHint: { marginTop: 4, fontFamily: fonts.body.regular, fontSize: 13, color: colors.muted },
  cycles: { marginTop: 14, flexDirection: 'row', gap: 5 },
  cycle: { flex: 1, height: 9, borderRadius: 5 },
  cycleDone: { backgroundColor: colors.success },
  cycleNow: { backgroundColor: colors.orange },
  cycleTodo: { backgroundColor: colors.track },

  art: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6 },
  mascot: { height: 130, width: 130 },

  footer: { paddingTop: 10, paddingBottom: 6, gap: 10 },
  music: {
    backgroundColor: colors.ink,
    borderRadius: radii.chip - 2,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  musicIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicText: { flex: 1 },
  musicTitle: { fontFamily: fonts.body.extraBold, fontSize: 13.5, color: colors.white },
  musicMeta: { fontFamily: fonts.body.regular, fontSize: 11.5, color: colors.mutedLight },

  buttons: { flexDirection: 'row', gap: 12 },
  pause: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderRadius: radii.xl,
    padding: 16,
    alignItems: 'center',
  },
  pauseLabel: {
    fontFamily: fonts.body.black,
    fontSize: 14.5,
    letterSpacing: 14.5 * 0.08,
    color: colors.white,
  },
  finish: {
    flex: 1.4,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 16,
    alignItems: 'center',
  },
  finishLabel: {
    fontFamily: fonts.body.black,
    fontSize: 14.5,
    letterSpacing: 14.5 * 0.08,
    color: colors.orangeDeep,
  },
});
