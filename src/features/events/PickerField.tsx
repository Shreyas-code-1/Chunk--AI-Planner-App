/**
 * A date or time control for the event form.
 *
 * TODO(design): the board draws no date or time picker anywhere. This uses
 * the native iOS compact picker (it ships in Expo Go) inside the board's
 * filled-box field. On Android the box opens the system dialog.
 */

import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { haptic } from '../../lib/haptics';
import { colors, fonts, radii } from '../../theme/tokens';

type Props = {
  mode: 'date' | 'time';
  value: Date;
  onChange(value: Date): void;
  label: string;
  /** What the Android box shows. */
  display: string;
};

export function PickerField({ mode, value, onChange, label, display }: Props) {
  const [open, setOpen] = useState(false);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.box}>
        <DateTimePicker
          accessibilityLabel={label}
          value={value}
          mode={mode}
          display="compact"
          minuteInterval={5}
          accentColor={colors.orange}
          themeVariant="light"
          onValueChange={(_, date) => onChange(date)}
        />
      </View>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPressIn={() => haptic('select')}
        onPress={() => setOpen(true)}
        style={[styles.box, styles.androidBox]}
      >
        <Text style={styles.androidText}>{display}</Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={value}
          mode={mode}
          onValueChange={(_, date) => {
            setOpen(false);
            onChange(date);
          }}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 9,
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: radii.xl,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  androidBox: { paddingVertical: 12, paddingHorizontal: 16 },
  androidText: { fontFamily: fonts.body.extraBold, fontSize: 15, color: colors.ink },
});
