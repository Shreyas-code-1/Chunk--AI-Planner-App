/**
 * The mode and dread chips on a task: each is one visible tap to cycle
 * (engine v3 §1, §2). Inference and defaults will be wrong sometimes, so the
 * fix can't live in an edit screen.
 *
 * TODO(design): no frame draws these on a task row; they use 3.6's chip style
 * at a smaller size.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DEFAULT_DREAD } from '../../planner/constants';
import { nextMode } from '../../planner/mode';
import type { Dread, Mode } from '../../planner/types';
import { haptic } from '../../lib/haptics';
import { colors, fonts, radii } from '../../theme/tokens';
import { useWork, type WorkAssignment } from './store';

const MODE_LABEL: Record<Mode, string> = {
  problems: 'Problems',
  writing: 'Writing',
  reading: 'Reading',
  memorizing: 'Memorizing',
};

const DREAD_LABEL: Record<Dread, string> = {
  fine: 'Fine',
  meh: 'Meh',
  dreading: 'Dreading',
};

const DREAD_CYCLE: readonly Dread[] = ['fine', 'meh', 'dreading'];
const nextDread = (dread: Dread) => DREAD_CYCLE[(DREAD_CYCLE.indexOf(dread) + 1) % 3];

export function TaskChips({ assignment }: { assignment: WorkAssignment }) {
  const setMode = useWork((state) => state.setMode);
  const setDread = useWork((state) => state.setDread);
  const dread = assignment.dread ?? DEFAULT_DREAD;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Kind of work: ${MODE_LABEL[assignment.mode]}. Tap to change.`}
        onPress={() => setMode(assignment.id, nextMode(assignment.mode))}
        onPressIn={() => haptic('select')}
        hitSlop={6}
        style={styles.chip}
      >
        <Text style={styles.label}>{MODE_LABEL[assignment.mode]}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Dread: ${DREAD_LABEL[dread]}. Tap to change.`}
        onPress={() => setDread(assignment.id, nextDread(dread))}
        onPressIn={() => haptic('select')}
        hitSlop={6}
        style={styles.chip}
      >
        <Text style={styles.label}>{DREAD_LABEL[dread]}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginTop: 6, flexDirection: 'row', gap: 6 },
  chip: {
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
  },
  label: { fontFamily: fonts.body.extraBold, fontSize: 11.5, color: colors.muted },
});
