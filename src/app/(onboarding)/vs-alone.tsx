/**
 * 2.11 WITH CHUNK VS ALONE.
 *
 * Purely informational — no input, nothing written. A two-bar comparison and
 * a claim.
 *
 * The bar heights are the board's (36% and 84% of a 250pt area) and are fixed
 * artwork, not data: nothing measures a real "1x" here. They are written as
 * the percentages the board uses rather than as the numbers they resolve to,
 * so the relationship stays visible.
 */

import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui';
import { OnboardingHeader } from '../../features/onboarding/OnboardingHeader';
import { colors, fonts, shadows } from '../../theme/tokens';

const PLOT_HEIGHT = 250;

export default function VsAlone() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <OnboardingHeader step={9} />

        <Text style={styles.headline}>{'Finish twice as\nmuch work with\nChunk'}</Text>

        <View style={[styles.card, shadows.hardEdge(6)]}>
          <View style={styles.plot}>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>On your own</Text>
              <View style={[styles.bar, styles.barAlone, { height: PLOT_HEIGHT * 0.36 }]}>
                <Text style={styles.barValueAlone}>1x</Text>
              </View>
            </View>

            <View style={styles.column}>
              <Text style={[styles.columnLabel, styles.columnLabelOn]}>With Chunk</Text>
              <View
                style={[
                  styles.bar,
                  styles.barChunk,
                  shadows.hardEdge(6),
                  { height: PLOT_HEIGHT * 0.84 },
                ]}
              >
                <Text style={styles.barValueChunk}>2x</Text>
              </View>
            </View>
          </View>

          <Text style={styles.caption}>
            Small chunks are easier to start, so more of them actually get done.
          </Text>
        </View>

        <View style={styles.spacer} />

        <Button label="CONTINUE" onPress={() => router.push('/progress-curve')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: { flex: 1, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 32 },
  headline: {
    marginTop: 22,
    fontFamily: fonts.display.extraBold,
    fontSize: 34,
    lineHeight: 34 * 1.15,
    color: colors.ink,
  },
  card: {
    marginTop: 26,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: 28,
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  plot: {
    height: PLOT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  column: { flex: 1, justifyContent: 'flex-end' },
  columnLabel: {
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: fonts.body.extraBold,
    fontSize: 13,
    color: colors.muted,
  },
  columnLabelOn: { color: colors.orangeDeep },
  bar: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 14,
  },
  barAlone: { backgroundColor: colors.track },
  barChunk: { backgroundColor: colors.orange },
  barValueAlone: {
    fontFamily: fonts.display.extraBold,
    fontSize: 22,
    color: colors.muted,
  },
  barValueChunk: {
    fontFamily: fonts.display.extraBold,
    fontSize: 30,
    color: colors.white,
  },
  caption: {
    marginTop: 18,
    textAlign: 'center',
    fontFamily: fonts.body.bold,
    fontSize: 13.5,
    lineHeight: 13.5 * 1.5,
    color: colors.muted,
  },
  spacer: { flex: 1 },
});
