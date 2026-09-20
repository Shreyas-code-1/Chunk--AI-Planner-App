/**
 * 2.10 DAILY PACE.
 *
 * TODO(design): **this sets the same value as 2.6's TIME A DAY slider.** Both
 * screens write `preferences.daily_target_minutes`, four screens apart, with
 * different controls and no indication on the board that one supersedes the
 * other. They share bounds (DAILY_MIN/MAX in the draft) and the later screen
 * simply wins, but one of the two is probably meant to go.
 *
 * The recommendation line counts the classes actually added on 2.5. If none
 * were added it is hidden rather than showing an invented number.
 */

import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Slider } from '../../components/ui';
import { OnboardingHeader } from '../../features/onboarding/OnboardingHeader';
import { DAILY_MAX, DAILY_MIN, DAILY_STEP, useDraft } from '../../features/onboarding/draft';
import { colors, displayLine, fonts } from '../../theme/tokens';

function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes}`;
}

/**
 * Which of EASY / STEADY / HARD reads as active.
 *
 * TODO(design): the board draws STEADY lit at 1 hr 30 but never says where the
 * boundaries are. Split into equal thirds of the offered range, which puts
 * 1 hr 30 in the middle band as drawn.
 */
const BANDS = ['EASY', 'STEADY', 'HARD'] as const;
function bandFor(minutes: number): number {
  const span = (DAILY_MAX - DAILY_MIN) / 3;
  return Math.min(2, Math.floor((minutes - DAILY_MIN) / span));
}

export default function DailyPace() {
  const router = useRouter();
  const dailyMinutes = useDraft((s) => s.dailyMinutes);
  const setDailyMinutes = useDraft((s) => s.setDailyMinutes);
  const classCount = useDraft((s) => s.classes.length);
  const active = bandFor(dailyMinutes);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <OnboardingHeader step={8} />

        <Text style={styles.headline}>
          {'How much do you\nwant to get through\neach day?'}
        </Text>

        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>Study time per school day</Text>
          <Text style={styles.readoutValue}>{formatMinutes(dailyMinutes)}</Text>
        </View>

        <View style={styles.bands}>
          {BANDS.map((band, index) => (
            <Text key={band} style={[styles.band, index === active && styles.bandOn]}>
              {band}
            </Text>
          ))}
        </View>

        <Slider
          value={dailyMinutes}
          min={DAILY_MIN}
          max={DAILY_MAX}
          step={DAILY_STEP}
          onChange={setDailyMinutes}
          style={styles.slider}
        />

        <View style={styles.ticks}>
          <Text style={styles.tick}>{formatMinutes(DAILY_MIN)}</Text>
          <Text style={styles.tick}>{formatMinutes((DAILY_MIN + DAILY_MAX) / 2)}</Text>
          <Text style={styles.tick}>{formatMinutes(DAILY_MAX)}</Text>
        </View>

        {classCount > 0 ? (
          <View style={styles.recommend}>
            <Text style={styles.recommendText}>
              Recommended for {classCount} {classCount === 1 ? 'class' : 'classes'}
            </Text>
          </View>
        ) : null}

        <View style={styles.spacer} />

        <Text style={styles.footnote}>You can change this any week.</Text>
        <Button label="CONTINUE" onPress={() => router.push('/vs-alone')} />
      </View>
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
  readout: { marginTop: 44, alignItems: 'center' },
  readoutLabel: {
    fontFamily: fonts.body.bold,
    fontSize: 13.5,
    color: colors.muted,
  },
  readoutValue: {
    marginTop: 4,
    fontFamily: fonts.display.extraBold,
    fontSize: 46,
    lineHeight: displayLine(46, 1.1),
    color: colors.ink,
  },
  bands: {
    marginTop: 26,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  band: {
    fontFamily: fonts.body.black,
    fontSize: 12,
    letterSpacing: 12 * 0.1,
    color: colors.mutedLight,
  },
  bandOn: { color: colors.orangeDeep },
  slider: { marginTop: 12 },
  ticks: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tick: {
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    color: colors.muted,
  },
  recommend: {
    marginTop: 26,
    backgroundColor: colors.amber,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
  },
  recommendText: {
    fontFamily: fonts.body.extraBold,
    fontSize: 13.5,
    color: colors.orangeDeep,
  },
  spacer: { flex: 1 },
  footnote: {
    marginBottom: 14,
    textAlign: 'center',
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    color: colors.muted,
  },
});
