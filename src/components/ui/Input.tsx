/**
 * Text input.
 *
 * The board draws two sizes, both with the same orange 2px border and radius
 * 20 but different weight in the layout:
 *  - `compact` — padding 14/16, 16px text. The COMPONENTS row's version.
 *  - `large` — padding 18/20, 20px text, with the hard bottom edge under it.
 *    This is the one on 2.4 NAME + GRADE, where the field is the screen.
 *
 * The board also draws a label above the field: 12px, weight 900, letter
 * spacing .12em, `#B4A498`, upper case.
 */

import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, radii, shadows } from '../../theme/tokens';

type Props = Omit<TextInputProps, 'style'> & {
  label?: string;
  size?: 'compact' | 'large';
  style?: StyleProp<ViewStyle>;
};

export function Input({ label, size = 'compact', style, ...input }: Props) {
  const large = size === 'large';
  const [focused, setFocused] = useState(false);

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, large ? styles.large : styles.compact, large && shadows.hardEdge(5)]}>
        <TextInput
          {...input}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          placeholderTextColor={colors.mutedLight}
          style={[styles.text, large ? styles.textLarge : styles.textCompact]}
        />
        {/*
          The board draws a 3x22 orange caret at the right edge of the large
          field. It is a drawn cursor, not the system one, so it is shown only
          while the field has focus rather than permanently.
        */}
        {large && focused ? <View style={styles.caret} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.body.black,
    fontSize: 12,
    letterSpacing: 12 * 0.12,
    color: colors.mutedLight,
    marginBottom: 10,
  },
  field: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.orange,
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compact: { paddingVertical: 14, paddingHorizontal: 16 },
  large: { paddingVertical: 18, paddingHorizontal: 20, justifyContent: 'space-between' },
  text: {
    flex: 1,
    fontFamily: fonts.body.extraBold,
    color: colors.ink,
    padding: 0,
  },
  textCompact: { fontSize: 16 },
  textLarge: { fontSize: 20 },
  caret: {
    width: 3,
    height: 22,
    borderRadius: 2,
    backgroundColor: colors.orange,
  },
});

// TODO(design): the board draws no error or disabled state for a field. Both
// are needed for 2.4's "name must not be empty" — flagged, not invented.
