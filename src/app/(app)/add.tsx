/**
 * 3.6 ADD ASSIGNMENT.
 *
 * The only way work gets into the app, so this is the screen that makes 3.1,
 * 3.2 and 3.5 stop being empty.
 *
 * TODO(design): **the board draws two fields it does not draw controls for.**
 * DUE reads "Thu, May 15" and HOW LONG reads "2 hours", both as plain filled
 * boxes with no picker anywhere on the board — the same gap 2.4's birth year
 * hit. They are built here as chip rows, because that is the control the board
 * uses everywhere else it offers a small set of choices (2.6, 2.8), rather
 * than as a wheel or a calendar that appears nowhere in the design.
 *
 * Engine v2 adds two things the board doesn't draw (TODO(design)): a "Today"
 * due chip, so the panic case is one tap, and the mode chip under the name,
 * which is inferred as you type and cycles with one tap when it's wrong.
 */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui';
import { ChevronLeft } from '../../components/icons';
import { useDraft } from '../../features/onboarding/draft';
import { useWork } from '../../features/work/store';
import { addDays, fromDateKey, planDateOf } from '../../lib/planDate';
import { haptic } from '../../lib/haptics';
import { inferMode, nextMode } from '../../planner/mode';
import type { Difficulty, Mode } from '../../planner/types';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

/** The board's Easy / Medium / Tough. The planner's third value is `hard`. */
const DIFFICULTIES: readonly (readonly [Difficulty, string])[] = [
  ['easy', 'Easy'],
  ['medium', 'Medium'],
  ['hard', 'Tough'],
];

/** "2 hours" on the board. Offered as the set the chunker actually splits well. */
const LENGTHS = [30, 60, 90, 120, 180, 240];

const DUE_FORMAT: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };

const MODE_LABEL: Record<Mode, string> = {
  problems: 'Problems',
  writing: 'Writing',
  reading: 'Reading',
  memorizing: 'Memorizing',
};

function lengthLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${hours % 1 === 0 ? hours : hours.toFixed(1)} ${hours === 1 ? 'hour' : 'hours'}`;
}

export default function AddAssignment() {
  const router = useRouter();
  const classes = useDraft((state) => state.classes);
  const addAssignment = useWork((state) => state.addAssignment);

  const today = planDateOf(new Date());
  /** Today, then the next fortnight. Beyond that the spread has nothing useful to do. */
  const dueOptions = useMemo(
    () => Array.from({ length: 15 }, (_, index) => addDays(today, index)),
    [today],
  );

  const [title, setTitle] = useState('');
  const [className, setClassName] = useState<string | null>(classes[0]?.name ?? null);
  const [due, setDue] = useState(dueOptions[3]);
  // Inferred until the student taps the chip; after that, theirs.
  const [chosenMode, setChosenMode] = useState<Mode | null>(null);
  const mode = chosenMode ?? inferMode(title, className);
  const [minutes, setMinutes] = useState(120);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [notes, setNotes] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const onSave = () => {
    const name = title.trim();
    if (name.length === 0) {
      setProblem('Give it a name so you recognise it later.');
      return;
    }

    const dueDay = fromDateKey(due);
    // End of the due day: the planner reads the day out of this, and a due
    // date that lands at midnight would read as the day before.
    dueDay.setHours(23, 59, 0, 0);

    const assignment = addAssignment({
      title: name,
      className,
      dueAt: dueDay,
      minutes,
      difficulty,
      notes: notes.trim(),
      mode,
      firstAction: null,
    });

    router.replace({ pathname: '/chunked', params: { assignment: assignment.id } });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => {
              haptic('select');
              router.back();
            }}
            style={styles.back}
          >
            <ChevronLeft size={16} color={colors.ink} strokeWidth={2.8} />
          </Pressable>
          <Text style={styles.title}>New assignment</Text>
        </View>

        <Text style={styles.label}>WHAT IS IT?</Text>
        <View style={[styles.field, styles.fieldFocus, shadows.hardEdge(5)]}>
          <TextInput
            accessibilityLabel="Assignment name"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setProblem(null);
            }}
            placeholder="Chapter 4 Notes"
            placeholderTextColor={colors.mutedLight}
            style={styles.fieldText}
            returnKeyType="next"
          />
        </View>

        {/* TODO(design): the mode chip has no frame; drawn with the chip styles. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Kind of work: ${MODE_LABEL[mode]}. Tap to change.`}
          onPress={() => {
            haptic('select');
            setChosenMode(nextMode(mode));
          }}
          style={[styles.chip, styles.chipOff, styles.modeChip]}
        >
          <Text style={styles.chipLabel}>{MODE_LABEL[mode]} · tap to change</Text>
        </Pressable>

        {classes.length > 0 ? (
          <>
            <Text style={styles.label}>CLASS</Text>
            <View style={styles.chips}>
              {classes.map((entry) => (
                <Choice
                  key={entry.name}
                  label={entry.name}
                  selected={className === entry.name}
                  onPress={() => setClassName(entry.name)}
                />
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.label}>DUE</Text>
        {/* Bleeds to the screen edges and leaves room below for the chosen
            chip's hard edge, which a horizontal ScrollView otherwise clips. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dueScroll}
          contentContainerStyle={styles.dueChips}
        >
          {dueOptions.map((key) => (
            <Choice
              key={key}
              label={
                key === today ? 'Today' : fromDateKey(key).toLocaleDateString(undefined, DUE_FORMAT)
              }
              selected={due === key}
              onPress={() => setDue(key)}
            />
          ))}
        </ScrollView>

        <Text style={styles.label}>HOW LONG?</Text>
        <View style={styles.chips}>
          {LENGTHS.map((value) => (
            <Choice
              key={value}
              label={lengthLabel(value)}
              selected={minutes === value}
              onPress={() => setMinutes(value)}
            />
          ))}
        </View>

        <Text style={styles.label}>HOW HARD DOES IT FEEL?</Text>
        <View style={styles.difficulties}>
          {DIFFICULTIES.map(([value, label]) => {
            const selected = difficulty === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  haptic('select');
                  setDifficulty(value);
                }}
                style={[
                  styles.difficulty,
                  selected ? styles.difficultyOn : styles.difficultyOff,
                  shadows.hardEdge(5),
                ]}
              >
                <Text style={[styles.difficultyLabel, selected && styles.difficultyLabelOn]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>NOTES</Text>
        <View style={[styles.field, styles.notes, shadows.hardEdge(5)]}>
          <TextInput
            accessibilityLabel="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Pages 88-94, three cycles, diagram at the end"
            placeholderTextColor={colors.mutedLight}
            style={[styles.fieldText, styles.notesText]}
            multiline
          />
        </View>

        {problem ? (
          // TODO(design): the board draws no error state for a field.
          <Text style={styles.problem}>{problem}</Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button label="CHUNK IT" onPress={onSave} />
      </View>
    </SafeAreaView>
  );
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={() => {
        haptic('select');
        onPress();
      }}
      style={[
        styles.chip,
        selected ? styles.chipOn : styles.chipOff,
        selected && shadows.hardEdge(4),
      ]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 20 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.display.extraBold,
    fontSize: 24,
    lineHeight: displayLine(24, 1.1),
    color: colors.ink,
    includeFontPadding: false,
  },

  label: {
    marginTop: 18,
    fontFamily: fonts.body.black,
    fontSize: 12,
    letterSpacing: 12 * 0.12,
    color: colors.mutedLight,
  },

  field: {
    marginTop: 9,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: radii.xl,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  fieldFocus: { borderColor: colors.orange },
  fieldText: {
    fontFamily: fonts.body.extraBold,
    fontSize: 17,
    color: colors.ink,
    padding: 0,
  },
  notes: { height: 86 },
  notesText: {
    fontFamily: fonts.body.semiBold,
    fontSize: 14,
    color: colors.muted,
    height: '100%',
    textAlignVertical: 'top',
  },

  chips: { marginTop: 9, flexDirection: 'row', gap: 8, flexWrap: 'wrap', paddingRight: 4 },
  dueScroll: { marginHorizontal: -22 },
  dueChips: { marginTop: 9, flexDirection: 'row', gap: 8, paddingHorizontal: 22, paddingBottom: 6 },
  modeChip: { marginTop: 10, alignSelf: 'flex-start' },
  chip: { borderRadius: radii.pill, paddingVertical: 9, paddingHorizontal: 15 },
  chipOff: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.cream },
  chipOn: { backgroundColor: colors.orange, paddingVertical: 10, paddingHorizontal: 16 },
  chipLabel: { fontFamily: fonts.body.extraBold, fontSize: 13, color: colors.muted },
  chipLabelOn: { fontFamily: fonts.body.black, color: colors.white },

  difficulties: { marginTop: 9, flexDirection: 'row', gap: 10 },
  difficulty: { flex: 1, borderRadius: radii.xl, padding: 14, alignItems: 'center' },
  difficultyOff: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.cream },
  difficultyOn: { backgroundColor: colors.amber, borderWidth: 2, borderColor: colors.orange },
  difficultyLabel: { fontFamily: fonts.body.extraBold, fontSize: 13.5, color: colors.muted },
  difficultyLabelOn: { fontFamily: fonts.body.black, color: colors.orangeDeep },

  problem: {
    marginTop: 14,
    fontFamily: fonts.body.bold,
    fontSize: 13,
    lineHeight: 13 * 1.45,
    color: colors.orangeDeep,
  },

  footer: { paddingHorizontal: 22, paddingBottom: 20, paddingTop: 8 },
});
