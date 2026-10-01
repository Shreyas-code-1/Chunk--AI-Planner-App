/**
 * 2.7 YOUR WEEK.
 *
 * Seven bars, each cycling light -> normal -> busy on tap. These become
 * `preferences.weekday_factors`, which the planner multiplies the daily target
 * by (WEEKDAY_FACTORS in src/planner/constants.ts).
 *
 * The board draws the week Monday-first, but `weekday_factors` is stored
 * Sunday..Saturday to match Postgres and JS `getDay()`. DISPLAY_ORDER is the
 * only place that difference lives.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '../../components/ui/AppImage';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, SpeechBubble, ScreenScroll } from '../../components/ui';
import { Clock } from '../../components/icons';
import { mascot } from '../../components/mascot';
import { OnboardingHeader } from '../../features/onboarding/OnboardingHeader';
import { useDraft, type DayLoad } from '../../features/onboarding/draft';
import { haptic } from '../../lib/haptics';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

/** Stored index (0 = Sunday) in the order the board draws them. */
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABEL = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const BAR: Record<DayLoad, { height: number; fill: string; tick: string; tickOpacity: number }> = {
  light: { height: 34, fill: colors.barTrack, tick: colors.tickLight, tickOpacity: 0.9 },
  normal: { height: 58, fill: colors.amber, tick: colors.tickNormal, tickOpacity: 0.85 },
  busy: { height: 86, fill: colors.orange, tick: colors.white, tickOpacity: 0.85 },
};

const LABEL_COLOR: Record<DayLoad, string> = {
  light: colors.mutedLight,
  normal: colors.muted,
  busy: colors.orangeDeep,
};

const LEGEND: readonly (readonly [DayLoad, string])[] = [
  ['light', 'LIGHT'],
  ['normal', 'NORMAL'],
  ['busy', 'BUSY'],
];

export default function Week() {
  const router = useRouter();
  const weekLoad = useDraft((s) => s.weekLoad);
  const cycleDay = useDraft((s) => s.cycleDay);
  const answered = useDraft((s) => !!s.answered.week);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScreenScroll>
        <StatusBar style="dark" />
        <View style={styles.body}>
          <OnboardingHeader step={5} />

          <Text style={styles.headline}>Which days{'\n'}are busiest?</Text>
          <Text style={styles.sub}>Tap a day to cycle light, normal, busy.</Text>

          <View style={styles.days}>
            {DISPLAY_ORDER.map((stored) => {
              const load = weekLoad[stored];
              const spec = BAR[load];
              return (
                <View key={stored} style={styles.dayColumn}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${DAY_LABEL[stored]}, ${load}`}
                    onPress={() => {
                      haptic('select');
                      cycleDay(stored);
                    }}
                    style={[
                      styles.bar,
                      { height: spec.height, backgroundColor: spec.fill },
                      load === 'busy' && shadows.hardEdge(5),
                    ]}
                  >
                    <View
                      style={[
                        styles.tick,
                        { backgroundColor: spec.tick, opacity: spec.tickOpacity },
                      ]}
                    />
                  </Pressable>
                  <Text style={[styles.dayLabel, { color: LABEL_COLOR[load] }]}>
                    {DAY_LABEL[stored]}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.legend}>
            {LEGEND.map(([load, label]) => (
              <View key={load} style={styles.legendItem}>
                <View style={[styles.swatch, { backgroundColor: BAR[load].fill }]} />
                <Text style={styles.legendLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.note, shadows.hardEdge(5)]}>
            <View style={styles.noteIcon}>
              <Clock size={18} color={colors.orangeDeep} strokeWidth={2.6} />
            </View>
            <Text style={styles.noteText}>
              {"Three busy days max — so there's somewhere to move work to."}
            </Text>
          </View>

          <View style={styles.spacer} />

          <SpeechBubble
            size="compact"
            style={styles.aside}
            mascot={<AppImage source={mascot.week} style={styles.mascot} resizeMode="contain" />}
          >
            {"Chunk won't pile work on your busy days."}
          </SpeechBubble>

          <Button
            label="CONTINUE"
            disabled={!answered}
            onPress={() => router.push('/when-you-start')}
          />
        </View>
      </ScreenScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: { flex: 1, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 32 },
  headline: {
    marginTop: 22,
    fontFamily: fonts.display.extraBold,
    fontSize: 34,
    lineHeight: displayLine(34, 1.15),
    color: colors.ink,
  },
  sub: {
    marginTop: 10,
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 14 * 1.5,
    color: colors.muted,
  },
  days: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
  },
  dayColumn: { flex: 1, alignItems: 'center', gap: 9 },
  bar: {
    width: '100%',
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  tick: { width: '42%', height: 4, borderRadius: 2 },
  dayLabel: { fontFamily: fonts.body.black, fontSize: 10.5 },
  legend: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: radii.xs,
    borderWidth: 2,
    borderColor: colors.cream,
  },
  legendLabel: {
    fontFamily: fonts.body.black,
    fontSize: 11,
    letterSpacing: 11 * 0.08,
    color: colors.muted,
  },
  note: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: radii.xl,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  noteIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.body.bold,
    fontSize: 13,
    lineHeight: 13 * 1.45,
    color: colors.muted,
  },
  spacer: { flex: 1 },
  aside: { marginBottom: 14 },
  mascot: { height: 66, width: 66 },
});
