/**
 * Bottom dock navigation.
 *
 * Board values: white, 2px `#F0E4D6` border, radius 24, padding 10/14, hard
 * bottom edge `0 6px 0 #6E4A28`. Four destinations either side of a raised
 * add button:
 *
 *   active tab    46x46 amber square at radius 16, icon 21px in #C65E06
 *   inactive tab  bare 21px icon in #C3B4A8, no container
 *   add           46x46 orange circle, edge 0 4px 0, plus in white at 3.0
 *
 * Note the add button's edge is 4px where the dock's own is 6px; they are not
 * the same value and are not made the same here.
 */

import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Calendar, Home, Person, Plus, Timer } from '../icons';
import { haptic } from '../../lib/haptics';
import { colors, radii, shadows } from '../../theme/tokens';

export type DockTab = 'home' | 'week' | 'focus' | 'profile';

const TABS: { key: DockTab; Icon: typeof Home; label: string }[] = [
  { key: 'home', Icon: Home, label: 'Home' },
  { key: 'week', Icon: Calendar, label: 'Week' },
  { key: 'focus', Icon: Timer, label: 'Focus' },
  { key: 'profile', Icon: Person, label: 'Profile' },
];

type Props = {
  active: DockTab;
  onSelect(tab: DockTab): void;
  onAdd(): void;
  style?: StyleProp<ViewStyle>;
};

export function BottomDock({ active, onSelect, onAdd, style }: Props) {
  // The add button sits in the middle of the row, between the second and
  // third destination, exactly as the board draws it.
  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  const tab = ({ key, Icon, label }: (typeof TABS)[number]) => {
    const isActive = key === active;
    return (
      <Pressable
        key={key}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={label}
        onPress={() => onSelect(key)}
        onPressIn={() => haptic('select')}
        style={isActive ? styles.activeTab : styles.tab}
      >
        <Icon
          size={21}
          color={isActive ? colors.orangeDeep : colors.mutedLine}
          strokeWidth={2.4}
        />
      </Pressable>
    );
  };

  return (
    <View style={[styles.dock, shadows.hardEdge(6), style]}>
      {left.map(tab)}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add an assignment"
        onPress={onAdd}
        onPressIn={() => haptic('press')}
        style={[styles.add, shadows.hardEdge(4)]}
      >
        <Plus size={21} color={colors.white} strokeWidth={3} />
      </Pressable>
      {right.map(tab)}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    borderRadius: radii.chip - 2, // 24 on the board
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tab: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  activeTab: {
    width: 46,
    height: 46,
    borderRadius: radii.lg,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    width: 46,
    height: 46,
    borderRadius: radii.pill,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
