/**
 * 2.9 WHAT GOES WRONG.
 *
 * TODO(design/schema): **this answer has nowhere to live.** `profiles.goals`
 * holds 2.3's multi-select; nothing in the schema stores a single "what
 * usually goes wrong". It is kept in the draft so the screen works and the
 * answer is not silently dropped, but it will not survive the flush until a
 * column exists. Raised here rather than invented.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '../../components/ui/AppImage';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, SpeechBubble } from '../../components/ui';
import { BellQuiet, Blocks, Clock, Waves } from '../../components/icons';
import type { IconProps } from '../../components/icons';
import { mascot } from '../../components/mascot';
import { OnboardingHeader } from '../../features/onboarding/OnboardingHeader';
import { useDraft, type Struggle } from '../../features/onboarding/draft';
import { haptic } from '../../lib/haptics';
import { colors, displayLine, fonts, radii, shadows, selectedOption } from '../../theme/tokens';

const OPTIONS: readonly (readonly [Struggle, string, (props: IconProps) => React.ReactNode])[] = [
  ['forget', 'I forget things are due', BellQuiet],
  ['start_late', 'I start too late', Clock],
  ['distracted', 'I get distracted', Waves],
  ['where_to_begin', "I don't know where to begin", Blocks],
];

export default function WhatGoesWrong() {
  const router = useRouter();
  const struggle = useDraft((s) => s.struggle);
  const setStruggle = useDraft((s) => s.setStruggle);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <OnboardingHeader step={7} />

        <Text style={styles.headline}>What usually{'\n'}goes wrong?</Text>
        <Text style={styles.sub}>Be honest.</Text>

        <ScrollView contentContainerStyle={styles.options} showsVerticalScrollIndicator={false}>
          {OPTIONS.map(([value, label, Icon]) => {
            const on = struggle === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={label}
                onPress={() => {
                  haptic('select');
                  setStruggle(value);
                }}
                style={[styles.option, shadows.hardEdge(6), on ? styles.optionOn : styles.optionOff]}
              >
                <View style={[styles.iconBox, on ? styles.iconBoxOn : styles.iconBoxOff]}>
                  <Icon size={20} color={on ? colors.white : colors.orangeDeep} strokeWidth={2.4} />
                </View>
                <Text style={[styles.optionLabel, on && styles.optionLabelOn]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <SpeechBubble
          size="compact"
          style={styles.aside}
          mascot={<AppImage source={mascot.whatGoesWrong} style={styles.mascot} resizeMode="contain" />}
        >
          {"Everyone's got one. I'll watch for yours."}
        </SpeechBubble>

        <Button
          label="CONTINUE"
          disabled={struggle === null}
          onPress={() => router.push('/daily-pace')}
        />
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
  sub: {
    marginTop: 10,
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 14 * 1.5,
    color: colors.muted,
  },
  options: { paddingTop: 22, paddingBottom: 22, gap: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: radii.xxl,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  optionOn: selectedOption,
  optionOff: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.cream },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxOff: { backgroundColor: colors.amber },
  // A translucent white well, so the orange fill shows through it.
  iconBoxOn: { backgroundColor: 'rgba(255,255,255,0.24)' },
  optionLabel: {
    flex: 1,
    fontFamily: fonts.body.extraBold,
    fontSize: 15.5,
    color: colors.ink,
  },
  optionLabelOn: { color: colors.white },
  aside: { marginBottom: 14 },
  mascot: { height: 68, width: 68 },
});
