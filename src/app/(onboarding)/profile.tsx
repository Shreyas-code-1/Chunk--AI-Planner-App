/**
 * 2.4 NAME + GRADE (+ birth year).
 *
 * Three differences from the board frame, all of them recorded in
 * docs/decision-log.md rather than decided here:
 *
 *  1. The "Riverside High · From your school account" row is **omitted**.
 *     There is no school column on `profiles` and no school-account provider
 *     anywhere in the stack, so the row could only be built by inventing one
 *     or by hard-coding "Riverside High" as fixture text.
 *  2. **Birth year is added**, which the board does not draw at all. It is the
 *     age gate (§12): grade cannot prove age, and under-13 signup has to be
 *     blocked. Flagged below for a design pass.
 *  3. The grade tiles run **9 through 12**, as the board draws them. The
 *     migration originally allowed only 10-12 and was corrected.
 */

import { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input, SpeechBubble } from '../../components/ui';
import { mascot } from '../../components/mascot';
import { OnboardingHeader } from '../../features/onboarding/OnboardingHeader';
import { useDraft } from '../../features/onboarding/draft';
import { haptic } from '../../lib/haptics';
import { colors, fonts, radii, shadows } from '../../theme/tokens';

const GRADES = [9, 10, 11, 12] as const;

/** §12: under-13 signup is blocked. Year granularity is all the schema keeps. */
const MINIMUM_AGE = 13;

export default function Profile() {
  const router = useRouter();
  const { displayName, grade, birthYear, setName, setGrade, setBirthYear } = useDraft();

  const thisYear = new Date().getFullYear();
  const yearText = birthYear == null ? '' : String(birthYear);

  const { underAge, complete } = useMemo(() => {
    const named = displayName.trim().length > 0;
    const plausible = birthYear != null && birthYear >= 1900 && birthYear <= thisYear;
    const tooYoung = plausible && thisYear - birthYear < MINIMUM_AGE;
    return { underAge: tooYoung, complete: named && grade != null && plausible && !tooYoung };
  }, [displayName, grade, birthYear, thisYear]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.body}>
        <OnboardingHeader step={2} />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SpeechBubble
            style={styles.bubble}
            mascot={<Image source={mascot.name} style={styles.mascot} resizeMode="contain" />}
          >
            Nice to meet you — who am I helping?
          </SpeechBubble>

          <Input
            label="YOUR NAME"
            size="large"
            style={styles.field}
            value={displayName}
            onChangeText={setName}
            placeholder=""
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="done"
          />

          <Text style={styles.label}>GRADE</Text>
          <View style={styles.grades}>
            {GRADES.map((value) => {
              const active = grade === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Grade ${value}`}
                  onPress={() => {
                    haptic('select');
                    setGrade(value);
                  }}
                  // The board widens the chosen tile to flex 1.15 rather than
                  // only recolouring it.
                  style={[
                    styles.grade,
                    shadows.hardEdge(5),
                    { flex: active ? 1.15 : 1 },
                    active ? styles.gradeOn : styles.gradeOff,
                  ]}
                >
                  <Text style={[styles.gradeText, active && styles.gradeTextOn]}>{value}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* TODO(design): the board draws no birth-year field. It exists
              because the age gate needs it and grade cannot prove age. Built
              as a plain field rather than the year picker the 0a answer
              describes, because no picker is drawn anywhere on the board. */}
          <Input
            label="BIRTH YEAR"
            size="large"
            style={styles.field}
            value={yearText}
            onChangeText={(text) => {
              const digits = text.replace(/[^0-9]/g, '').slice(0, 4);
              setBirthYear(digits.length === 0 ? null : Number(digits));
            }}
            keyboardType="number-pad"
            maxLength={4}
            returnKeyType="done"
          />

          {underAge ? (
            // TODO(design): no error styling exists on the board for a field.
            // This is deliberately plain rather than an invented treatment.
            <Text style={styles.gateNote}>
              Chunk is for students aged {MINIMUM_AGE} and over.
            </Text>
          ) : null}
        </ScrollView>

        <Button
          label="CONTINUE"
          disabled={!complete}
          onPress={() => router.push('/classes')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  scroll: {
    paddingBottom: 26,
  },
  bubble: { marginTop: 22 },
  mascot: { height: 78, width: 78 },
  field: { marginTop: 26 },
  label: {
    marginTop: 26,
    fontFamily: fonts.body.black,
    fontSize: 12,
    letterSpacing: 12 * 0.12,
    color: colors.mutedLight,
  },
  grades: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  grade: {
    borderWidth: 2,
    borderRadius: radii.xl,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeOff: {
    backgroundColor: colors.card,
    borderColor: colors.cream,
  },
  gradeOn: {
    backgroundColor: colors.amber,
    borderColor: colors.orange,
  },
  gradeText: {
    fontFamily: fonts.display.extraBold,
    fontSize: 30,
    lineHeight: 30,
    color: colors.mutedLine,
  },
  gradeTextOn: {
    color: colors.orangeDeep,
  },
  gateNote: {
    marginTop: 14,
    fontFamily: fonts.body.bold,
    fontSize: 13,
    color: colors.orangeDeep,
  },
});
