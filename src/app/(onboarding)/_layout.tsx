/**
 * Onboarding stack, 2.2 through 2.5.
 *
 * A route group, so the screens keep flat paths (`/welcome`, `/goals`) while
 * sharing a stack. The header is off globally in the root layout; 2.3 onward
 * draw their own back button and progress bar (OnboardingHeader), and 2.2
 * deliberately has neither — it is the first screen and there is nowhere back
 * to go.
 */

import { Stack } from 'expo-router';

import { colors } from '../../theme/tokens';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // 2.2 is white and 2.3-2.5 are the warm page cream. The cream is the
        // safer default for the gap between screens during a transition.
        contentStyle: { backgroundColor: colors.page },
      }}
    />
  );
}
