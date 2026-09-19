/**
 * The header every onboarding question screen shares: a back button and a
 * progress bar, side by side.
 *
 * The board draws it identically on 2.3, 2.4, 2.5 and 2.6 and advances the
 * fill by twenty points each time — 20%, 40%, 60%, 80%. That is five steps,
 * not four, so `step` is out of `TOTAL_STEPS` rather than out of the number of
 * screens built so far; 2.6 keeps its 80% when batch 2 arrives.
 *
 * 2.1 and 2.2 have no header at all, which is why this is not in the layout.
 */

import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ChevronLeft } from '../../components/icons';
import { haptic } from '../../lib/haptics';
import { colors, radii } from '../../theme/tokens';

/** 2.3 through 2.7. The bar is at step/TOTAL of the way across. */
const TOTAL_STEPS = 5;

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
