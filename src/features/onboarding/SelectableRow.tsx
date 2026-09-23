/**
 * The tappable row with a check box on its right, drawn on 2.3 GOALS and again
 * on 2.5 CLASSES.
 *
 * The two screens differ in exactly one respect and it is not decoration: a
 * selected goal on 2.3 fills amber, while a selected class on 2.5 stays white
 * and is marked only by its orange border. Both are the board's, so `fill`
 * carries the difference rather than one screen being "corrected" to match the
 * other.
 */

import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { Check } from '../../components/icons';
import { haptic } from '../../lib/haptics';
import { colors, radii, selectedOption, shadows } from '../../theme/tokens';

type Props = {
  selected: boolean;
  onPress(): void;
  children: ReactNode;
  /** 'amber' is the filled selection (now solid orange); 'white' leaves it white. */
  fill?: 'amber' | 'white';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function SelectableRow({
  selected,
  onPress,
  children,
  fill = 'amber',
  accessibilityLabel,
  style,
}: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        haptic('select');
        onPress();
      }}
      style={[
        styles.row,
        shadows.hardEdge(5),
        selected
          ? {
              ...(fill === 'amber'
                ? selectedOption
                : { backgroundColor: colors.card, borderColor: colors.orange }),
            }
          : { backgroundColor: colors.card, borderColor: colors.cream },
        style,
      ]}
    >
      <View style={styles.content}>{children}</View>
      <CheckBox checked={selected} onOrange={selected && fill === 'amber'} />
    </Pressable>
  );
}

/** The 26px box: filled orange with a white tick, or an empty cream outline. */
function CheckBox({ checked, onOrange }: { checked: boolean; onOrange: boolean }) {
  return (
    <View
      style={[
        styles.box,
        checked ? (onOrange ? styles.boxOnOrange : styles.boxChecked) : styles.boxEmpty,
      ]}
    >
      {checked ? (
        <Check size={14} color={onOrange ? colors.orange : colors.white} strokeWidth={3.4} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: radii.xxl,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 14,
  },
  content: {
    flex: 1,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.orange,
  },
  boxOnOrange: {
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.ink,
  },
  boxEmpty: {
    borderWidth: 2,
    borderColor: colors.creamDeep,
  },
});
