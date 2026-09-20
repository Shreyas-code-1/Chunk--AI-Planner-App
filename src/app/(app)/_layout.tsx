/**
 * The app proper, section 3 onward.
 *
 * A separate group from `(onboarding)` because the two have different
 * backgrounds and different exits: onboarding is a line you walk once, this is
 * where you live afterwards. The dock is drawn per screen rather than by this
 * layout — 3.3 FOCUS and 3.4 CHUNK COMPLETE do not carry one.
 */

import { Stack } from 'expo-router';

import { colors } from '../../theme/tokens';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.page },
      }}
    />
  );
}
