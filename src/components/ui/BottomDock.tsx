/**
 * Bottom dock navigation — the v3 dock, design/v3/dock-home.png (@3x).
 *
 * A full-width white bar with a 1pt cream top rule, owning the bottom safe
 * area. Five equal slots; the add button sits in the middle.
 *
 *   active tab    54x50 #FFF1E2 tile, 1pt #FFB46B border, radius 16
 *   icons         the Warm Orange set, full colour at every state
 *   add           46x46 #FF7A12 square, radius 15, 4pt #DE5F06 edge
 */

import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptic } from '../../lib/haptics';
import { colors, radii, shadows } from '../../theme/tokens';
import { Plus } from '../icons';
import { AppImage } from './AppImage';

export type DockTab = 'home' | 'week' | 'focus' | 'profile';

type Tab = { key: DockTab; label: string; icon: number; width: number; height: number };

const TABS: Tab[] = [
  { key: 'home', label: 'Home', icon: require('../../../assets/icons/dock-home.png'), width: 29.3, height: 27.2 },
  { key: 'week', label: 'Week', icon: require('../../../assets/icons/dock-calendar.png'), width: 22.9, height: 25.7 },
  { key: 'focus', label: 'Progress', icon: require('../../../assets/icons/dock-stopwatch.png'), width: 22.9, height: 28 },
  { key: 'profile', label: 'Profile', icon: require('../../../assets/icons/dock-person.png'), width: 23.9, height: 25.7 },
];

type Props = {
  active: DockTab;
  onSelect(tab: DockTab): void;
  onAdd(): void;
};

export function BottomDock({ active, onSelect, onAdd }: Props) {
  const insets = useSafeAreaInsets();

  const tab = ({ key, label, icon, width, height }: Tab) => {
    const isActive = key === active;
    return (
      <View key={key} style={styles.slot}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: isActive }}
          accessibilityLabel={label}
          onPress={() => onSelect(key)}
          onPressIn={() => haptic('select')}
          style={[styles.tab, isActive && styles.activeTab]}
        >
          <AppImage source={icon} style={{ width, height }} />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, DOCK_PADDING_TOP) }]}>
      {TABS.slice(0, 2).map(tab)}
      <View style={styles.slot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add an assignment"
          onPress={onAdd}
          onPressIn={() => haptic('press')}
          style={[styles.add, shadows.hardEdge(4, colors.dockAddEdge)]}
        >
          <Plus size={26} color={colors.white} strokeWidth={4} />
        </Pressable>
      </View>
      {TABS.slice(2).map(tab)}
    </View>
  );
}

const DOCK_PADDING_TOP = 11;

/** For `preloadImages`. */
export const DOCK_ICON_SOURCES = TABS.map((tab) => tab.icon);

const styles = StyleSheet.create({
  dock: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.cream,
    paddingTop: DOCK_PADDING_TOP,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  slot: { flex: 1, alignItems: 'center' },
  tab: {
    width: 54,
    height: 50,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: { backgroundColor: colors.dockActive, borderColor: colors.dockActiveBorder },
  add: {
    marginTop: 2,
    width: 46,
    height: 46,
    borderRadius: radii.mdAlt,
    backgroundColor: colors.dockAdd,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
