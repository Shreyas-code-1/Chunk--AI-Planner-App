/**
 * The header every onboarding question screen shares: a back button and a
 * progress bar, side by side.
 *
 * 2.1 and 2.2 have no header at all, which is why this is not in the layout.
 *
 * TODO(design): **the board's own fill percentages contradict each other** and
 * are not used here. It draws 2.3-2.6 at 20/40/60/80, then 2.7-2.9 at
 * 62/74/86, then 2.10-2.13 at 62/70/78/100 — three series from three editing
 * passes. Followed literally the bar would run backwards twice, at 2.6 -> 2.7
 * and again at 2.9 -> 2.10, which reads as lost progress.
 *
 * So the fill is computed from the screen's position among the eleven
 * header-bearing screens (2.3 through 2.13) instead. That keeps it monotonic
 * and agrees with the board at its one unambiguous point: 2.13 is 100%.
 */

import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ChevronLeft } from '../../components/icons';
import { haptic } from '../../lib/haptics';
import { colors, radii } from '../../theme/tokens';

/** 2.3 through 2.12 carry the header (2.13 was removed). The bar is at step/TOTAL across. */
const TOTAL_STEPS = 10;

export function OnboardingHeader({ step }: { step: number }) {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        onPress={() => {
          haptic('select');
          router.back();
        }}
        style={styles.back}
      >
        {/* The board's own 16px glyph at stroke 2.8 in the warm muted grey. */}
        <ChevronLeft size={16} color={colors.mutedWarm} strokeWidth={2.8} />
      </Pressable>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: TOTAL_STEPS, now: step }}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    flex: 1,
    height: 14,
    borderRadius: radii.sm,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.orange,
    borderRadius: radii.sm,
  },
});
