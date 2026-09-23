/**
 * 2.5 CLASSES.
 *
 * The board draws this frame already populated — Biology, Algebra II, English
 * Lit, World History, Chemistry, each with a period and a teacher, under the
 * same implied school-account import as 2.4's school row. **That is a
 * populated-state mockup, not a launch state.** There is no import, so
 * shipping those five would hard-code fictional classes into the app, which is
 * exactly what §9.1 forbids.
 *
 * So this ships as the board's empty state — the dashed "Add a class" row
 * alone — and fills as classes are added. Everything else on the frame is the
 * board's: the chip, the two-line row, the check box, the spacing.
 *
 * See docs/decision-log.md.
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, Input } from '../../components/ui';
import { HighlightChip } from '../../components/ui/StrokedText';
import { Check, Plus } from '../../components/icons';
import { OnboardingHeader } from '../../features/onboarding/OnboardingHeader';
import { useDraft } from '../../features/onboarding/draft';
import { isRealClass } from '../../features/onboarding/classNames';
import { haptic } from '../../lib/haptics';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

export default function Classes() {
  const router = useRouter();
  const classes = useDraft((s) => s.classes);
  const addClass = useDraft((s) => s.addClass);
  const removeClass = useDraft((s) => s.removeClass);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [rejected, setRejected] = useState(false);

  const commit = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setRejected(false);
      setAdding(false);
      return;
    }
    if (!isRealClass(trimmed)) {
      setRejected(true);
      return;
    }
    setRejected(false);
    haptic('select');
    addClass({ name: trimmed });
    // Stay open: adding a timetable is five or six entries in a row, and
    // reopening the field each time would be the wrong shape for that.
    setName('');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.body}>
        <OnboardingHeader step={3} />

        <View style={styles.heading}>
          <Text style={styles.headline}>Which classes</Text>
          <View style={styles.headlineRow}>
            <Text style={styles.headline}>are we </Text>
            <HighlightChip fontSize={34}>chunking</HighlightChip>
            <Text style={styles.headline}>?</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {classes.map((entry, index) => (
            <View key={`${entry.name}-${index}`} style={[styles.row, shadows.hardEdge(5)]}>
              <Chip className={entry.name} size={48} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{entry.name}</Text>
                {/* Period and teacher are nullable and there is nowhere to
                    enter them yet — TODO(design): the board shows them but
                    draws no form that collects them. */}
                {entry.period || entry.teacher ? (
                  <Text style={styles.rowMeta}>
                    {[entry.period, entry.teacher].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
              </View>
              {/* The board's check box. With no import to choose from, its
                  meaning here is "added" — tapping it takes the class back
                  off the list. TODO(design): confirm this reading. */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${entry.name}`}
                hitSlop={8}
                onPress={() => {
                  haptic('select');
                  removeClass(index);
                }}
                style={styles.checkOn}
              >
                <Check size={14} color={colors.white} strokeWidth={3.4} />
              </Pressable>
            </View>
          ))}

          {adding ? (
            <Input
              autoFocus
              value={name}
              onChangeText={(text) => {
                setName(text);
                setRejected(false);
              }}
              onSubmitEditing={commit}
              onBlur={commit}
              placeholder="Class name"
              placeholderTextColor={colors.mutedLight}
              autoCapitalize="words"
              returnKeyType="done"
            />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add a class"
              onPress={() => {
                haptic('select');
                setAdding(true);
              }}
              style={styles.add}
            >
              <View style={styles.addIcon}>
                <Plus size={16} color={colors.orangeDeep} strokeWidth={3} />
              </View>
              <Text style={styles.addLabel}>Add a class</Text>
            </Pressable>
          )}
          {/* TODO(design): the board draws no error state for this field. */}
          {rejected ? (
            <Text style={styles.error}>
              {"That doesn't look like a class. Try something like \"AP Biology\"."}
            </Text>
          ) : null}
        </ScrollView>

        <Button
          label="CONTINUE"
          disabled={classes.length === 0}
          onPress={() => router.push('/study-style')}
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
  heading: { marginTop: 22 },
  // See 2.2: 'baseline' misplaces a View child, so these stay centred.
  headlineRow: { flexDirection: 'row', alignItems: 'center' },
  headline: {
    fontFamily: fonts.display.extraBold,
    fontSize: 34,
    lineHeight: displayLine(34, 1.15),
    color: colors.ink,
    // Matches the chip's own text — see welcome.tsx.
    includeFontPadding: false,
  },
  list: {
    paddingTop: 20,
    paddingBottom: 20,
    gap: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.orange,
    borderRadius: radii.xxl,
    padding: 16,
  },
  rowText: { flex: 1 },
  rowTitle: {
    fontFamily: fonts.body.extraBold,
    fontSize: 16.5,
    color: colors.ink,
  },
  rowMeta: {
    marginTop: 1,
    fontFamily: fonts.body.semiBold,
    fontSize: 12.5,
    color: colors.muted,
  },
  checkOn: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.creamDeep,
    borderRadius: radii.xxl,
    padding: 15,
  },
  addIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    fontFamily: fonts.body.bold,
    fontSize: 13,
    color: colors.orangeDeep,
  },
  addLabel: {
    fontFamily: fonts.body.extraBold,
    fontSize: 14.5,
    color: colors.muted,
  },
});
