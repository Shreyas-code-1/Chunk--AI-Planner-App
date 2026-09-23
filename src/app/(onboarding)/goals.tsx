/**
 * 2.3 GOALS.
 *
 * Multi-select, which is why the rows are check boxes and not a radio group:
 * `profiles.goals` is a `goal[]`. The order the array keeps is the order they
 * were tapped in, not the order they are drawn — see the draft store.
 *
 * CONTINUE is gated on choosing at least one (decision log, 22 Sep).
 */

import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, SpeechBubble } from '../../components/ui';
import { mascot } from '../../components/mascot';
import { OnboardingHeader } from '../../features/onboarding/OnboardingHeader';
import { SelectableRow } from '../../features/onboarding/SelectableRow';
import { useDraft } from '../../features/onboarding/draft';
import type { Goal } from '../../api/types';
import { colors, fonts } from '../../theme/tokens';

/** Label and enum value together, in the board's order. */
const GOALS: readonly (readonly [Goal, string])[] = [
  ['get_started', 'Getting started at all'],
  ['stay_organized', 'Staying organized'],
  ['hit_deadlines', 'Hitting deadlines'],
  ['study_for_tests', 'Studying for tests'],
  ['focus_longer', 'Focusing for longer'],
];

export default function Goals() {
  const router = useRouter();
  const selected = useDraft((s) => s.goals);
  const toggleGoal = useDraft((s) => s.toggleGoal);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.body}>
        <OnboardingHeader step={1} />

        <SpeechBubble
          style={styles.bubble}
          mascot={<Image source={mascot.goals} style={styles.mascot} resizeMode="contain" />}
        >
          {"What's getting in your way right now?"}
        </SpeechBubble>

        <ScrollView
          contentContainerStyle={styles.options}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {GOALS.map(([value, label]) => {
            const isSelected = selected.includes(value);
            return (
              <SelectableRow
                key={value}
                selected={isSelected}
                onPress={() => toggleGoal(value)}
                accessibilityLabel={label}
              >
                <Text style={[styles.label, isSelected && styles.labelSelected]}>{label}</Text>
              </SelectableRow>
            );
          })}
        </ScrollView>

        <Button
          label="CONTINUE"
          disabled={selected.length === 0}
          onPress={() => router.push('/profile')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.page,
  },
  body: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  bubble: {
    marginTop: 22,
  },
  mascot: {
    height: 78,
    width: 78,
  },
  options: {
    paddingTop: 22,
    paddingBottom: 22,
    gap: 12,
  },
  label: {
    fontFamily: fonts.body.bold,
    fontSize: 16,
    color: colors.ink,
  },
  // The board thickens a chosen row's label from 700 to 800.
  labelSelected: {
    fontFamily: fonts.body.extraBold,
    color: colors.white,
  },
});
