/**
 * 2.16 PAYWALL.
 *
 * TODO(batch 8): **nothing here charges anyone.** `react-native-purchases` is
 * deliberately not installed — importing a native module crashes Expo Go — so
 * this is the screen only. Both buttons currently move on; the real purchase
 * arrives with the first EAS build, through src/features/billing/usePro.ts.
 * The chosen plan is what that call will be handed.
 *
 * The board draws one state only — 12 months chosen, 1 month not — so the
 * selected look is read off the frame rather than invented: gold 3px border,
 * the `0 7px 0` gold edge, the green check. Unselected is the other card's:
 * 2px cream border, the `0 5px 0` sand edge, no check. MOST POPULAR stays on
 * the yearly card in both states — it labels the offer, not the selection —
 * and each card keeps its own type and price layout throughout.
 *
 * TODO(design): the board fades the artwork out with a CSS `mask-image`
 * gradient. React Native has no mask, so the image is drawn whole and the fade
 * is missing rather than approximated with an overlay, which would band
 * against the cream.
 */

import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HighlightChip } from '../../components/ui/StrokedText';
import { Check, ChevronLeft } from '../../components/icons';
import { mascot } from '../../components/mascot';
import { haptic } from '../../lib/haptics';
import type { PlanId } from '../../features/billing/usePro';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

/**
 * Prices, as the board draws them.
 *
 * Provisional, and in one place on purpose: the App Store is the real source
 * of these and they must eventually be read from the product, not typed here.
 * Until then, changing a price is a change to this block and nowhere else.
 */
const PRICING = {
  yearlyMonthly: '$7.99',
  yearlyTotal: '$95.88',
  yearlySaving: '27%',
  monthly: '$10.99',
  trialDays: 7,
} as const;

const BENEFITS = [
  'Unlimited chunking and re-plans',
  'Quizzes, flashcards and audio recaps',
  'Syllabus scanning, no limits',
];

export default function Paywall() {
  const router = useRouter();
  const onwards = () => router.replace('/login');

  const [plan, setPlan] = useState<PlanId>('yearly');
  const choose = (next: PlanId) => {
    haptic('select');
    setPlan(next);
  };

  const cardEdge = (selected: boolean) =>
    selected ? shadows.hardEdge(7, colors.goldEdge) : shadows.hardEdge(5, colors.edgeSand);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.headerRow}>
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
          <ChevronLeft size={18} color={colors.ink} strokeWidth={2.8} />
        </Pressable>

        <View style={[styles.proBadge, shadows.hardEdge(4, colors.goldEdge)]}>
          <Text style={styles.proLabel}>PRO</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Image source={mascot.paywall} style={styles.art} resizeMode="contain" />

        <View style={styles.headlineBlock}>
          <View style={styles.headlineRow}>
            <Text style={styles.headline}>Try </Text>
            {/* The one highlight chip on the board with no hard edge under it. */}
            <HighlightChip fontSize={31} background={colors.gold} edge={false}>
              {`${PRICING.trialDays} days free`}
            </HighlightChip>
          </View>
          <Text style={styles.headline}>of Chunk Pro</Text>
        </View>

        <View style={styles.plans} accessibilityRole="radiogroup">
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: plan === 'yearly' }}
            accessibilityLabel={`12 months, ${PRICING.yearlyMonthly} a month, ${PRICING.yearlyTotal} billed yearly, save ${PRICING.yearlySaving}`}
            onPress={() => choose('yearly')}
            style={[
              styles.planFeatured,
              plan === 'yearly' ? styles.planSelected : styles.planUnselected,
              cardEdge(plan === 'yearly'),
            ]}
          >
            <View style={styles.popular}>
              <Text style={styles.popularLabel}>MOST POPULAR</Text>
            </View>
            {plan === 'yearly' && (
              <View style={[styles.chosen, shadows.hardEdge(3, colors.successDeep)]}>
                <Check size={15} color={colors.white} strokeWidth={3.6} />
              </View>
            )}

            <View style={styles.planRow}>
              <View style={styles.planText}>
                <Text style={styles.planName}>12 months</Text>
                <Text style={styles.planDetail}>
                  {`${PRICING.yearlyTotal} billed yearly · save ${PRICING.yearlySaving}`}
                </Text>
              </View>
              <View style={styles.planPriceBlock}>
                <Text style={styles.planPrice}>{`${PRICING.yearlyMonthly} / MO`}</Text>
                <Text style={styles.planStrike}>{PRICING.monthly}</Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: plan === 'monthly' }}
            accessibilityLabel={`1 month, ${PRICING.monthly} a month, billed monthly, cancel anytime`}
            onPress={() => choose('monthly')}
            style={[
              styles.planPlain,
              plan === 'monthly' ? styles.planSelected : styles.planUnselected,
              cardEdge(plan === 'monthly'),
            ]}
          >
            {plan === 'monthly' && (
              <View style={[styles.chosen, shadows.hardEdge(3, colors.successDeep)]}>
                <Check size={15} color={colors.white} strokeWidth={3.6} />
              </View>
            )}

            <View style={styles.planText}>
              <Text style={styles.planNamePlain}>1 month</Text>
              <Text style={styles.planDetail}>Billed monthly · cancel anytime</Text>
            </View>
            <Text style={styles.planPricePlain}>{`${PRICING.monthly} / MO`}</Text>
          </Pressable>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <View style={styles.benefitCheck}>
                <Check size={14} color={colors.ink} strokeWidth={3.6} />
              </View>
              <Text style={styles.benefitLabel}>{benefit}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footnote}>Cancel anytime in the App Store</Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            haptic('press');
            // TODO(batch 8): `plan` is the product RevenueCat gets asked for here.
            onwards();
          }}
          style={[styles.cta, shadows.hardEdge(6)]}
        >
          <Text style={styles.ctaLabel}>START MY FREE WEEK</Text>
        </Pressable>

        <Pressable accessibilityRole="button" onPress={onwards} style={styles.decline}>
          <Text style={styles.declineLabel}>NO THANKS</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paywallPage },
  headerRow: {
    paddingTop: 6,
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: radii.mdAlt,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBadge: {
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  proLabel: {
    fontFamily: fonts.display.extraBold,
    fontSize: 16,
    letterSpacing: 16 * 0.04,
    color: colors.ink,
  },
  scroll: { paddingBottom: 8 },
  art: { width: '100%', height: 200 },
  headlineBlock: { alignItems: 'center', paddingHorizontal: 24, marginTop: 16 },
  headlineRow: { flexDirection: 'row', alignItems: 'center' },
  headline: {
    fontFamily: fonts.display.extraBold,
    fontSize: 31,
    lineHeight: displayLine(31, 1.15),
    color: colors.ink,
    textAlign: 'center',
    // Matches the chip's own text — see welcome.tsx.
    includeFontPadding: false,
  },
  plans: { marginTop: 20, paddingHorizontal: 24, gap: 14 },
  // Each card keeps the padding and radius the board gives it. Only the
  // border and the hard edge beneath it follow the selection.
  planFeatured: {
    backgroundColor: colors.card,
    borderRadius: radii.xxl,
    padding: 18,
  },
  planSelected: { borderWidth: 3, borderColor: colors.gold },
  planUnselected: { borderWidth: 2, borderColor: colors.cream },
  popular: {
    position: 'absolute',
    top: -13,
    left: 16,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  popularLabel: {
    fontFamily: fonts.body.black,
    fontSize: 10.5,
    letterSpacing: 10.5 * 0.1,
    color: colors.ink,
  },
  chosen: {
    position: 'absolute',
    top: -13,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 14 },
  planText: { flex: 1 },
  planName: {
    fontFamily: fonts.display.extraBold,
    fontSize: 24,
    lineHeight: displayLine(24, 1.15),
    color: colors.ink,
  },
  planNamePlain: {
    fontFamily: fonts.display.bold,
    fontSize: 22,
    lineHeight: displayLine(22, 1.15),
    color: colors.ink,
  },
  planDetail: {
    marginTop: 1,
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    color: colors.muted,
  },
  planPriceBlock: { alignItems: 'flex-end' },
  planPrice: {
    fontFamily: fonts.body.black,
    fontSize: 16,
    letterSpacing: 16 * 0.02,
    color: colors.orangeDeep,
  },
  planStrike: {
    fontFamily: fonts.body.extraBold,
    fontSize: 12,
    color: colors.strike,
    textDecorationLine: 'line-through',
  },
  planPlain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radii.xxl,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  planPricePlain: {
    fontFamily: fonts.body.black,
    fontSize: 15,
    letterSpacing: 15 * 0.02,
    color: colors.ink,
  },
  benefits: { marginTop: 20, paddingHorizontal: 24, gap: 10 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitCheck: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitLabel: {
    flex: 1,
    fontFamily: fonts.body.extraBold,
    fontSize: 14,
    color: colors.ink,
  },
  footer: { paddingHorizontal: 24, paddingBottom: 26 },
  footnote: {
    textAlign: 'center',
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    color: colors.muted,
  },
  cta: {
    marginTop: 12,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radii.xl,
    padding: 17,
    alignItems: 'center',
  },
  ctaLabel: {
    fontFamily: fonts.body.black,
    fontSize: 15,
    letterSpacing: 15 * 0.08,
    color: colors.ink,
  },
  decline: { marginTop: 14, alignItems: 'center' },
  declineLabel: {
    fontFamily: fonts.body.black,
    fontSize: 13.5,
    letterSpacing: 13.5 * 0.08,
    color: colors.muted,
  },
});
