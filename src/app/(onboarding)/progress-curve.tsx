/**
 * 2.12 YOUR PROGRESS CURVE.
 *
 * Informational, like 2.11 — nothing is read or written. The curve is fixed
 * artwork illustrating a claim, not a plot of the user's data: they have none
 * yet, and there is no honest way to draw a personal progress curve during
 * onboarding. The path values are the board's own, kept as drawn.
 */

import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { Button } from '../../components/ui';
import { OnboardingHeader } from '../../features/onboarding/OnboardingHeader';
import { colors, displayLine, fonts, shadows } from '../../theme/tokens';

/** The board's own 300x170 drawing, unchanged. */
const CURVE = 'M10 130 C 70 126, 100 118, 130 100 C 165 78, 210 40, 285 22';
const CURVE_FILL = `${CURVE} L285 155 L10 155 Z`;

export default function ProgressCurve() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <OnboardingHeader step={10} />

        <Text style={styles.headline}>
          {"You're set up to\nstay ahead of\nyour deadlines"}
        </Text>

        <View style={[styles.card, shadows.hardEdge(6)]}>
          <Text style={styles.cardTitle}>Work finished on time</Text>

          <View style={styles.plot}>
            <Svg viewBox="0 0 300 170" width="100%" height={170}>
              <Defs>
                <LinearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={colors.orange} stopOpacity="0.28" />
                  <Stop offset="100%" stopColor={colors.orange} stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Path d={CURVE_FILL} fill="url(#curveFill)" />
              <Path d={CURVE} fill="none" stroke={colors.ink} strokeWidth={3.5} strokeLinecap="round" />
              {[
                [10, 130],
                [98, 119],
                [150, 89],
              ].map(([cx, cy]) => (
                <Circle
                  key={`${cx}`}
                  cx={cx}
                  cy={cy}
                  r={6.5}
                  fill={colors.white}
                  stroke={colors.ink}
                  strokeWidth={3.5}
                />
              ))}
              <Circle cx={285} cy={22} r={14} fill={colors.orange} />
              <Path
                d="M279 22l5 5 8-9"
                fill="none"
                stroke={colors.white}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Line x1={10} y1={158} x2={290} y2={158} stroke={colors.cream} strokeWidth={2.5} />
            </Svg>

            <View style={styles.axis}>
              <Text style={styles.axisLabel}>Day 3</Text>
              <Text style={styles.axisLabel}>Week 1</Text>
              <Text style={styles.axisLabel}>Month 1</Text>
            </View>
          </View>

          <Text style={styles.caption}>
            The first few days are the slowest. Once the routine sticks, most students clear
            their week without the late-night scramble.
          </Text>
        </View>

        <View style={styles.spacer} />
        <Button label="CONTINUE" onPress={() => router.push('/building-plan')} />
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
    lineHeight: displayLine(34, 1.15),
    color: colors.ink,
  },
  card: {
    marginTop: 26,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: 28,
    padding: 20,
  },
  cardTitle: {
    fontFamily: fonts.body.extraBold,
    fontSize: 13.5,
    color: colors.ink,
  },
  plot: { marginTop: 14 },
  axis: {
    marginTop: 6,
    paddingHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontFamily: fonts.body.extraBold,
    fontSize: 12.5,
    color: colors.muted,
  },
  caption: {
    marginTop: 16,
    fontFamily: fonts.body.bold,
    fontSize: 13.5,
    lineHeight: 13.5 * 1.5,
    color: colors.muted,
  },
  spacer: { flex: 1 },
});
