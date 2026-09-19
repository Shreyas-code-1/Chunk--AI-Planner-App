/**
 * The subject chip.
 *
 * A 42x42 rounded square holding a three-letter abbreviation. The colour and
 * the abbreviation both come from the class name deterministically — see
 * src/theme/subjects.ts.
 */

import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { fonts, radii } from '../../theme/tokens';
import { subjectFor } from '../../theme/subjects';

type Props = {
  /** The class name, e.g. "AP Biology 2". The chip derives the rest. */
  className: string;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ className, style }: Props) {
  const subject = subjectFor(className);

  return (
    <View
      accessibilityLabel={className}
      style={[styles.chip, { backgroundColor: subject.background }, style]}
    >
      <Text style={[styles.label, { color: subject.text }]}>{subject.abbrev}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: 42,
    height: 42,
    borderRadius: radii.mdAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.body.black,
    fontSize: 12,
  },
});
