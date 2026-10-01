/**
 * The app proper, section 3 onward.
 *
 * A separate group from `(onboarding)` because the two have different
 * backgrounds and different exits: onboarding is a line you walk once, this is
 * where you live afterwards.
 *
 * The dock lives here, not in each screen, so it stays mounted while tabs
 * change — drawn per screen, it faded out and back with every tap. It shows
 * only on the tab screens; 3.3 FOCUS, 3.4 CHUNK COMPLETE and Settings don't
 * carry one. Tab-to-tab switches don't animate.
 */

import { Stack, usePathname } from 'expo-router';
import { View } from 'react-native';

import { BottomDock, type DockTab } from '../../components/ui';
import { useDockNavigation } from '../../features/navigation/useDockNavigation';
import { colors } from '../../theme/tokens';

const TAB_OF: Record<string, DockTab> = {
  '/home': 'home',
  '/all-work': 'home',
  '/today': 'week',
  '/progress': 'focus',
  '/you': 'profile',
};

const NO_ANIMATION = { animation: 'none' } as const;

export default function AppLayout() {
  const tab = TAB_OF[usePathname()];
  const dock = useDockNavigation(tab);

  return (
    <View style={{ flex: 1, backgroundColor: colors.page }}>
      <Stack
        screenOptions={{
          headerShown: false,
          // See the onboarding layout: a cross-fade rather than a slide.
          animation: 'fade',
          animationDuration: 180,
          contentStyle: { backgroundColor: colors.page },
        }}
      >
        <Stack.Screen name="home" options={NO_ANIMATION} />
        <Stack.Screen name="today" options={NO_ANIMATION} />
        <Stack.Screen name="progress" options={NO_ANIMATION} />
        <Stack.Screen name="you" options={NO_ANIMATION} />
      </Stack>
      {tab ? <BottomDock active={tab} {...dock} /> : null}
    </View>
  );
}
