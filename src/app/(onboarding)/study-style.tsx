/**
 * 2.6 STUDY STYLE.
 *
 * Three questions on one screen, feeding `preferences`: chunk length, the best
 * time of day, and how long a day.
 *
 * TODO(design): **BEST TIME OF DAY has no obvious mapping to the schema.**
 * `preferences` stores `available_start` and `available_end` — a window — and
 * the board asks for a single preferred time out of five. The chosen index is
 * held in the draft and the mapping is deferred to the flush, rather than
 * inventing a window width here.
 */

import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, SpeechBubble, Slider } from '../../components/ui';
import { mascot } from '../../components/mascot';
import { OnboardingHeader } from '../../features/onboarding/OnboardingHeader';
import { OptionTile, TileRow } from '../../features/onboarding/OptionTile';
import {
  BEST_TIMES,
  DAILY_MAX,
  DAILY_MIN,
  DAILY_STEP,
  useDraft,
} from '../../features/onboarding/draft';
import type { ChunkLengthPref } from '../../api/types';
import { haptic } from '../../lib/haptics';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

/** The board's three tiles: the headline number, then the word beneath it. */
const LENGTHS: readonly (readonly [ChunkLengthPref, string, string])[] = [
  ['short', '20', 'short'],
  ['mixed', '20–45', 'mixed'],
  ['long', '50', 'long'],
];

/**
 * The five bars form a curve around the selected time — the board draws the
 * chosen one tall and orange, its neighbours medium, the far pair short. These
 * are indexed by distance from the selection, which is what reproduces the
 * drawn state and generalises to any of the five being picked.
 */
const BAR_HEIGHT = [82, 52, 36];
const BAR_RADIUS = [18, 14, 12];

function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes}`;
}

export default function StudyStyle() {
  const router = useRouter();
  const {
    chunkLength,
    bestTime,
    dailyMinutes,
    answered,
    setChunkLength,
    setBestTime,
    setDailyMinutes,
  } = useDraft();
  const pickedTime = answered.bestTime ? bestTime : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <OnboardingHeader step={4} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.headline}>How do you{'\n'}study best?</Text>

          <Text style={styles.label}>CHUNK LENGTH</Text>
          <TileRow style={styles.tiles}>
            {LENGTHS.map(([value, headline, word]) => (
              <OptionTile
                key={value}
                selected={!!answered.chunkLength && chunkLength === value}
                onPress={() => setChunkLength(value)}
                headline={headline}
                caption={word}
                accessibilityLabel={`${word} chunks`}
              />
            ))}
          </TileRow>

          <Text style={styles.label}>BEST TIME OF DAY</Text>
          <View style={[styles.bars, shadows.hardEdge(5)]}>
            {BEST_TIMES.map((time, index) => {
              // Nothing is picked until tapped, so every bar starts short.
              const distance =
                pickedTime === null ? 2 : Math.min(Math.abs(index - pickedTime), 2);
              const active = index === pickedTime;
              return (
                <View key={time.minutes} style={[styles.barColumn, active && styles.barColumnWide]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={time.label}
                    onPress={() => {
                      haptic('select');
                      setBestTime(index);
                    }}
                    style={[
                      styles.bar,
                      {
                        height: BAR_HEIGHT[distance],
                        borderRadius: BAR_RADIUS[distance],
                        backgroundColor: active ? colors.orange : colors.barTrack,
                      },
                      active && shadows.hardEdge(5),
                    ]}
                  />
                  <Text style={[styles.barLabel, active && styles.barLabelOn]}>{time.label}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.dailyRow}>
            <Text style={styles.label}>TIME A DAY</Text>
            <Text style={styles.dailyValue}>{formatMinutes(dailyMinutes)}</Text>
          </View>
          <Slider
            value={dailyMinutes}
            min={DAILY_MIN}
            max={DAILY_MAX}
            step={DAILY_STEP}
            onChange={setDailyMinutes}
            style={styles.slider}
          />
        </ScrollView>

        <SpeechBubble
          size="compact"
          style={styles.aside}
          mascot={<Image source={mascot.studyStyle} style={styles.mascot} resizeMode="contain" />}
        >
          {"Be honest — I'd rather plan small and finish."}
        </SpeechBubble>

        <Button
          label="CONTINUE"
          disabled={!answered.chunkLength || !answered.bestTime}
          onPress={() => router.push('/week')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: { flex: 1, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 32 },
  scroll: { paddingBottom: 12 },
  headline: {
    marginTop: 22,
    fontFamily: fonts.display.extraBold,
    fontSize: 34,
    lineHeight: displayLine(34, 1.15),
    color: colors.ink,
  },
  label: {
    marginTop: 22,
    fontFamily: fonts.body.black,
    fontSize: 12,
    letterSpacing: 12 * 0.12,
    color: colors.mutedLight,
  },
  tiles: { marginTop: 11 },
  bars: {
    marginTop: 11,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: radii.xxl,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 9,
  },
  barColumn: { flex: 1, alignItems: 'center', gap: 9 },
  barColumnWide: { flex: 1.3 },
  bar: { width: '100%' },
  barLabel: {
    fontFamily: fonts.body.extraBold,
    fontSize: 10.5,
    color: colors.mutedLight,
  },
  barLabelOn: {
    fontFamily: fonts.body.black,
    color: colors.orangeDeep,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  dailyValue: {
    fontFamily: fonts.display.extraBold,
    fontSize: 30,
    color: colors.ink,
  },
  slider: { marginTop: 14 },
  aside: { marginBottom: 14 },
  mascot: { height: 66, width: 66 },
});
