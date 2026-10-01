import { ONBOARDING_STEPS, type OnboardingStep } from '../onboarding/draft';
export function startDestination(state: { completed: boolean; lastStep: OnboardingStep | null }, _authenticated: boolean) {
  if (state.completed) return '/home' as const;
  return state.lastStep && ONBOARDING_STEPS.includes(state.lastStep) ? state.lastStep : '/welcome';
}
