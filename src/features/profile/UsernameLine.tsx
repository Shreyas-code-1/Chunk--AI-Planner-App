/**
 * "@MAYACHEN · JOINED 2026" on 5.2 PROFILE. Tap to add or change the
 * username; it edits in place in the same type. Not drawn on the board: the
 * empty "ADD USERNAME" prompt and the inline edit are ours (asked for 30 Sep).
 */

import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { haptic } from '../../lib/haptics';
import { colors, fonts } from '../../theme/tokens';
import { useUsername } from './username';

export function UsernameLine({ joinedYear }: { joinedYear: number | null }) {
  const username = useUsername((s) => s.username);
  const setUsername = useUsername((s) => s.setUsername);
  const [draft, setDraft] = useState<string | null>(null);
  const joined = joinedYear ? ` · JOINED ${joinedYear}` : '';

  const save = () => {
    if (draft == null) return;
    if (!setUsername(draft)) {
      Alert.alert('Try another username', '3–20 letters, numbers or underscores.');
      return;
    }
    setDraft(null);
  };

  if (draft != null) {
    return (
      <View style={styles.row}>
        <Text style={styles.text}>@</Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={save}
          onBlur={save}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
          returnKeyType="done"
          placeholder="username"
          placeholderTextColor={colors.mutedLight}
          accessibilityLabel="Username"
          style={[styles.text, styles.input]}
        />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={username ? `Username ${username}. Tap to change.` : 'Add a username'}
      onPressIn={() => haptic('select')}
      onPress={() => setDraft(username ?? '')}
      style={styles.row}
      hitSlop={8}
    >
      {username ? (
        <Text style={styles.text}>{`@${username.toUpperCase()}${joined}`}</Text>
      ) : (
        <Text style={styles.text}>
          <Text style={styles.add}>+ ADD USERNAME</Text>
          {joined}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { marginTop: 19, flexDirection: 'row', alignItems: 'center' },
  text: {
    fontFamily: fonts.body.black,
    fontSize: 13,
    letterSpacing: 13 * 0.04,
    color: colors.muted,
  },
  input: { flex: 1, padding: 0, color: colors.ink },
  add: { color: colors.orangeDeep },
});
