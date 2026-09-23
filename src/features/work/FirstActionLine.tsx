/**
 * The first-action line on 3.3 (engine v2 §3): one small, concrete first step,
 * read before the timer matters. Tap to edit; an empty edit restores the
 * mode's default.
 *
 * TODO(design): no frame draws it. Placed under the chunk title in body type,
 * as the spec says.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { firstActionFor } from '../../planner/mode';
import { haptic } from '../../lib/haptics';
import { colors, fonts } from '../../theme/tokens';
import { useWork } from './store';

export function FirstActionLine({ assignmentId }: { assignmentId: string }) {
  const assignment = useWork((s) => s.assignments.find((a) => a.id === assignmentId));
  const setFirstAction = useWork((s) => s.setFirstAction);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  if (!assignment) return null;
  const line = firstActionFor(assignment.mode, assignment.firstAction);

  if (editing) {
    const commit = () => {
      setFirstAction(assignmentId, draft.trim() || null);
      setEditing(false);
    };
    return (
      <TextInput
        autoFocus
        accessibilityLabel="First step"
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={commit}
        onBlur={commit}
        returnKeyType="done"
        style={[styles.line, styles.input]}
      />
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`First step: ${line}. Tap to edit.`}
      onPress={() => {
        haptic('select');
        setDraft(line);
        setEditing(true);
      }}
    >
      <Text style={styles.line}>{line}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  line: {
    marginTop: 6,
    fontFamily: fonts.body.bold,
    fontSize: 15,
    color: colors.ink,
  },
  input: {
    padding: 0,
    borderBottomWidth: 2,
    borderBottomColor: colors.cream,
  },
});
