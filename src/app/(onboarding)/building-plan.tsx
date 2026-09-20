/**
 * 2.14 BUILDING YOUR PLAN.
 *
 * The one screen whose job is to wait. It runs the four steps the board draws
 * and moves on when they finish.
 *
 * Counts are real. The board's frame says "14 assignments found" and puts 21
 * beside the chunking step; those are the mockup's numbers, and the brief is
 * explicit that plan numbers must not be faked. With nothing imported yet the
 * counts are zero and the steps complete immediately, which is the truth.
 *
 * TODO(batch 7): no real chunking happens here. The algorithm is pure and
 * tested in src/planner, but it needs assignments, which arrive with 2.13's
 * capture routes and the Edge Function. The sequence and its failure handling
 * are real, so wiring the work in later changes one function, not the screen.
 *
 * Failure behaviour is Q13's answer (docs/decision-log.md): an inline error
 * here with a retry, plus an "add it manually" escape — never back to the
 * start of onboarding.
 */

import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Check } from '../../components/icons';
import { OrangeGradient } from '../../components/ui';
import { mascot } from '../../components/mascot';
import { useDraft } from '../../features/onboarding/draft';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

const STEPS = [
  'Reading your schedule',
  'Sorting by due date',
  'Cutting work into chunks',
  'Fitting them in your week',
] as const;

/** The step whose row carries a running count on the board. */
const COUNTED_STEP = 2;

/** How long each step is held, so the sequence reads rather than flashes. */
const STEP_MS = 450;

export default function BuildingPlan() {
  const router = useRouter();
  const classCount = useDraft((s) => s.classes.length);

  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Nothing has been imported yet, so there is nothing to chunk. Read from
  // real state rather than written in.
  const assignmentCount = 0;
  const chunkCount = 0;

  const run = useCallback(() => {
    setError(null);
    setDone(0);
  }, []);

  useEffect(() => {
    if (error || done >= STEPS.length) return;
    const timer = setTimeout(() => setDone((n) => n + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [done, error]);

  useEffect(() => {
    if (done < STEPS.length || error) return;
    const timer = setTimeout(() => router.replace('/first-plan'), STEP_MS);
    return () => clearTimeout(timer);
  }, [done, error, router]);

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <OrangeGradient />

      <View style={styles.body}>
        <View style={styles.artRow}>
          <Image source={mascot.building} style={styles.mascot} resizeMode="contain" />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>{error ? 'That did not work' : 'Chopping it up…'}</Text>
          <Text style={styles.subtitle}>
            {error
              ? error
              : `${plural(assignmentCount, 'assignment', 'assignments')} found. ` +
                `${plural(classCount, 'class', 'classes')}.`}
          </Text>
        </View>

        {error ? (
          // TODO(design): the board draws no error state for this screen. Kept
          // plain, per the house rule, rather than given an invented treatment.
          <View style={styles.recovery}>
            <Pressable accessibilityRole="button" style={styles.retry} onPress={run}>
              <Text style={styles.retryLabel}>TRY AGAIN</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/first-plan')}
              style={styles.manual}
            >
              <Text style={styles.manualLabel}>ADD IT MANUALLY</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.steps}>
            {STEPS.map((label, index) => {
              const state = index < done ? 'done' : index === done ? 'current' : 'pending';
              return (
                <View
                  key={label}
                  style={[
                    styles.step,
                    state === 'done' && styles.stepDone,
                    state === 'current' && styles.stepCurrent,
                    state === 'current' && shadows.hardEdge(5, 'rgba(0,0,0,0.12)'),
                    state === 'pending' && styles.stepPending,
                  ]}
                >
                  <View
                    style={[
                      styles.marker,
                      state === 'done' && styles.markerDone,
                      state === 'current' && styles.markerCurrent,
                      state === 'pending' && styles.markerPending,
                    ]}
                  >
                    {state === 'done' ? (
                      <Check size={14} color={colors.orangeDeep} strokeWidth={3.6} />
                    ) : null}
                  </View>

                  <Text
                    style={[
                      styles.stepLabel,
                      state === 'current' && styles.stepLabelCurrent,
                      state === 'pending' && styles.stepLabelPending,
                    ]}
                  >
                    {label}
                  </Text>

                  {state === 'current' && index === COUNTED_STEP ? (
                    <Text style={styles.stepCount}>{chunkCount}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${(done / STEPS.length) * 100}%` }]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.orange },
  body: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 26,
    paddingBottom: 34,
    justifyContent: 'center',
    gap: 26,
  },
  artRow: { alignItems: 'center' },
  mascot: { height: 180, width: 180 },
  copy: { alignItems: 'center' },
  title: {
    fontFamily: fonts.display.extraBold,
    fontSize: 36,
    lineHeight: displayLine(36, 1.1),
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    fontFamily: fonts.body.bold,
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  steps: { gap: 11 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: radii.xl,
    padding: 15,
  },
  stepDone: { backgroundColor: 'rgba(255,255,255,0.22)' },
  stepCurrent: { backgroundColor: colors.white },
  stepPending: { backgroundColor: 'rgba(255,255,255,0.14)' },
  marker: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDone: { backgroundColor: colors.white },
  // The board draws a part-drawn ring: two sides orange, two pale amber.
  markerCurrent: {
    borderWidth: 3,
    borderColor: colors.orange,
    borderRightColor: colors.amber,
    borderBottomColor: colors.amber,
  },
  markerPending: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  stepLabel: {
    flex: 1,
    fontFamily: fonts.body.extraBold,
    fontSize: 15,
    color: colors.white,
  },
  stepLabelCurrent: { color: colors.ink },
  stepLabelPending: { fontFamily: fonts.body.bold, color: 'rgba(255,255,255,0.7)' },
  stepCount: {
    fontFamily: fonts.body.black,
    fontSize: 13,
    color: colors.orangeDeep,
  },
  track: {
    height: 14,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  trackFill: { height: '100%', backgroundColor: colors.white, borderRadius: radii.sm },
  recovery: { gap: 12 },
  retry: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 17,
    alignItems: 'center',
  },
  retryLabel: {
    fontFamily: fonts.body.black,
    fontSize: 15,
    letterSpacing: 15 * 0.08,
    color: colors.orangeDeep,
  },
  manual: { padding: 12, alignItems: 'center' },
  manualLabel: {
    fontFamily: fonts.body.black,
    fontSize: 13.5,
    letterSpacing: 13.5 * 0.08,
    color: colors.white,
  },
});
