/**
 * The subject chip.
 *
 * A rounded square holding a three-letter abbreviation. The colour and the
 * abbreviation both come from the class name deterministically — see
 * src/theme/subjects.ts.
 *
 * The board draws it at two sizes: 42 with radius 15 in the COMPONENTS row and
 * on the assignment card, and 48 with radius 17 on 2.5 CLASSES. The radius is
 * not a fixed fraction of the side in either case, so it travels with the size
 * rather than being derived from it.
 */

import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { fonts, radii } from '../../theme/tokens';
import { subjectFor } from '../../theme/subjects';

type Props = {
  /** The class name, e.g. "AP Biology 2". The chip derives the rest. */
  className: string;
  /** 42 in the COMPONENTS row, 48 on 2.5. */
  size?: 42 | 48;
  style?: StyleProp<ViewStyle>;
};

/** Side to the radius and label size the board pairs with it. */
const SIZES: Record<42 | 48, { radius: number; fontSize: number }> = {
  42: { radius: radii.mdAlt, fontSize: 12 },
  48: { radius: 17, fontSize: 13 },
};

export function Chip({ className, size = 42, style }: Props) {
  const subject = subjectFor(className);
  const spec = SIZES[size];

  return (
    <View
      accessibilityLabel={className}
      style={[
        styles.chip,
        { width: size, height: size, borderRadius: spec.radius },
        { backgroundColor: subject.background },
        style,
      ]}
    >
      <Text style={[styles.label, { color: subject.text, fontSize: spec.fontSize }]}>
        {subject.abbrev}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.body.black,
  },
});
