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
        // Not the platform push. The board is a sequence of full-bleed cards,
        // and sliding one over the next reads like a slide deck rather than an
        // app — every screen announces that it came from the right. A short
        // cross-fade lets the content change without implying a direction,
        // which is how the lesson flows this is modelled on behave.
        animation: 'fade',
        animationDuration: 180,
        // 2.2 is white and 2.3-2.5 are the warm page cream. The cream is the
        // safer default for the gap between screens during a transition.
        contentStyle: { backgroundColor: colors.page },
      }}
    />
  );
}
