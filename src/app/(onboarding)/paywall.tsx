/**
 * 2.16 PAYWALL.
 *
 * Store prices come from the billing layer. Nothing here charges anyone:
 * CONTINUE and NO THANKS move to login; purchasing is a later step.
 *
 * The board draws one state only — 12 months chosen, 1 month not — so the
 * selected look is read off the frame rather than invented: gold 3px border
 * and the `0 7px 0` gold edge. Unselected is the other card's: 2px cream
 * border and the `0 5px 0` sand edge. The board's green check badge is not
 * drawn on either — removed by request. MOST POPULAR stays on
 * the yearly card in both states — it labels the offer, not the selection —
 * and each card keeps its own type and price layout throughout.
 *
 * TODO(design): the board fades the artwork out with a CSS `mask-image`
 * gradient. React Native has no mask, so the image is drawn whole and the fade
 * is missing rather than approximated with an overlay, which would band
 * against the cream.
 */

import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HighlightChip } from '../../components/ui/StrokedText';
import { Check, ChevronLeft } from '../../components/icons';
import { mascot } from '../../components/mascot';
import { haptic } from '../../lib/haptics';
import type { PlanId } from '../../features/billing/usePro';
import { useOffering } from '../../features/billing/useOffering';
import { getPaywallPlans } from '../../features/billing/paywallPlans';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

const BENEFITS = [
  'Unlimited chunking and re-plans',
  'Quizzes, flashcards and audio recaps',
  'Syllabus scanning, no limits',
];

export default function Paywall() {
  const router = useRouter();
  const onwards = () => router.replace('/login');

  const [plan, setPlan] = useState<PlanId>('yearly');
  const { data, isPending, isError, isFetching, refetch } = useOffering();
  const plans = isError ? null : getPaywallPlans(data);
  const selectedPackage = plans?.[plan].package;
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
            <Text style={styles.headline}>Meet </Text>
            {/* The one highlight chip on the board with no hard edge under it. */}
            <HighlightChip fontSize={31} background={colors.gold} edge={false}>
              Chunk Pro
            </HighlightChip>
          </View>
        </View>

        {isPending ? (
          <View style={styles.plans} accessibilityLiveRegion="polite">
            <ActivityIndicator color={colors.orangeDeep} />
            <Text style={styles.footnote}>Loading plans…</Text>
          </View>
        ) : !plans ? (
          <View style={styles.plans} accessibilityLiveRegion="polite">
            <Text style={styles.footnote}>Plans are unavailable right now. Please try again.</Text>
            <Pressable accessibilityRole="button" disabled={isFetching}
              accessibilityState={{ disabled: isFetching }}
              onPress={() => { void refetch(); }} style={styles.decline}>
              <Text style={styles.declineLabel}>{isFetching ? 'RETRYING…' : 'TRY AGAIN'}</Text>
            </Pressable>
          </View>
        ) : (
        <View style={styles.plans} accessibilityRole="radiogroup">
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: plan === 'yearly' }}
            accessibilityLabel={plans.yearly.accessibilityLabel}
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
            <View style={styles.planRow}>
              <View style={styles.planText}>
                <Text style={styles.planName}>12 months</Text>
                <Text style={styles.planDetail}>
                  {plans.yearly.detail}
                </Text>
              </View>
              <View style={styles.planPriceBlock}>
                <Text style={styles.planPrice}>{plans.yearly.priceLabel}</Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: plan === 'monthly' }}
            accessibilityLabel={plans.monthly.accessibilityLabel}
            onPress={() => choose('monthly')}
            style={[
              styles.planPlain,
              plan === 'monthly' ? styles.planSelected : styles.planUnselected,
              cardEdge(plan === 'monthly'),
            ]}
          >
            <View style={styles.planText}>
              <Text style={styles.planNamePlain}>1 month</Text>
              <Text style={styles.planDetail}>{plans.monthly.detail}</Text>
            </View>
            <Text style={styles.planPricePlain}>{plans.monthly.priceLabel}</Text>
          </Pressable>
        </View>
        )}

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
        <Text style={styles.footnote}>Continuing will not charge you.</Text>

        <Pressable
          accessibilityRole="button"
          disabled={!selectedPackage || isPending}
          accessibilityState={{ disabled: !selectedPackage || isPending }}
          onPress={() => {
            if (!selectedPackage || isPending) return;
            haptic('press');
            // selectedPackage is the actual SDK package; no purchase is made yet.
            onwards();
          }}
          style={[styles.cta, shadows.hardEdge(6), !selectedPackage && { opacity: 0.5 }]}
        >
          <Text style={styles.ctaLabel}>CONTINUE</Text>
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
