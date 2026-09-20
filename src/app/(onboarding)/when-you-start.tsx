/**
 * 2.8 WHEN YOU START.
 *
 * Sets `preferences.start_style`, which decides how many days before a due
 * date the spread begins.
 *
 * The copy is the board's and is hypothetical — there is no real assignment
 * during onboarding, so "Something's due Friday" and the Monday/Wednesday/
 * Thursday subtitles are an illustration of the choice, not a live schedule.
 */

import { Image, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, SpeechBubble } from '../../components/ui';
import { Check } from '../../components/icons';
import { mascot } from '../../components/mascot';
import { OnboardingHeader } from '../../features/onboarding/OnboardingHeader';
import { useDraft } from '../../features/onboarding/draft';
import type { StartStyle } from '../../api/types';
import { haptic } from '../../lib/haptics';
import { colors, fonts, radii, shadows } from '../../theme/tokens';

const OPTIONS: readonly (readonly [StartStyle, string, string])[] = [
  ['asap', 'As soon as I can', 'Start Monday, finish early'],
  ['few_days', 'A few days before', 'Start Wednesday, steady pace'],
  ['day_before', 'The day before', 'One focused push Thursday'],
];

export default function WhenYouStart() {
  const router = useRouter();
  const startStyle = useDraft((s) => s.startStyle);
  const setStartStyle = useDraft((s) => s.setStartStyle);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <OnboardingHeader step={6} />

        <Text style={styles.headline}>
          {"Something's due\nFriday. When do\nyou want to start?"}
        </Text>

        <ScrollView contentContainerStyle={styles.options} showsVerticalScrollIndicator={false}>
          {OPTIONS.map(([value, title, detail]) => {
            const on = startStyle === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${title}. ${detail}`}
                onPress={() => {
                  haptic('select');
                  setStartStyle(value);
                }}
                style={[styles.option, shadows.hardEdge(6), on ? styles.optionOn : styles.optionOff]}
              >
                <View style={[styles.radio, on ? styles.radioOn : styles.radioOff]}>
                  {on ? <Check size={14} color={colors.orange} strokeWidth={4} /> : null}
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, on && styles.onWhite]}>{title}</Text>
                  <Text style={[styles.optionDetail, on && styles.onWhiteSoft]}>{detail}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <SpeechBubble
          size="compact"
          style={styles.aside}
          mascot={<Image source={mascot.whenYouStart} style={styles.mascot} resizeMode="contain" />}
        >
          {"I'll plan around how you like to work."}
        </SpeechBubble>

        <Button label="CONTINUE" onPress={() => router.push('/what-goes-wrong')} />
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
    lineHeight: 34 * 1.15,
    color: colors.ink,
  },
  options: { paddingTop: 20, paddingBottom: 20, gap: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: radii.xxl,
    paddingVertical: 17,
    paddingHorizontal: 18,
  },
  // The chosen option takes the ink border the board reserves for emphasis —
  // 3px, not the 2px cream every other card carries.
  optionOn: { backgroundColor: colors.orange, borderWidth: 3, borderColor: colors.ink },
  optionOff: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.cream },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.white, borderWidth: 3, borderColor: colors.ink },
  radioOff: { backgroundColor: colors.barTrack, borderWidth: 2, borderColor: colors.tickLight },
  optionText: { flex: 1 },
  optionTitle: {
    fontFamily: fonts.body.extraBold,
    fontSize: 16,
    color: colors.ink,
  },
  optionDetail: {
    marginTop: 2,
    fontFamily: fonts.body.semiBold,
    fontSize: 12.5,
    color: colors.muted,
  },
  onWhite: { color: colors.white },
  onWhiteSoft: { color: 'rgba(255,255,255,0.9)' },
  aside: { marginBottom: 14 },
  mascot: { height: 66, width: 66 },
});
