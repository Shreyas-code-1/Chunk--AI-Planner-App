/**
 * 2.16 PAYWALL.
 *
 * Store prices and purchases come from the billing layer. A purchase continues
 * to login only after Chunk Pro is active; NO THANKS still skips the paywall.
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

import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppImage } from '../../components/ui/AppImage';
import { HighlightChip } from '../../components/ui/StrokedText';
import { safeBack } from '../../features/navigation/safeBack';
import { useDraft } from '../../features/onboarding/draft';
import { Check, ChevronLeft } from '../../components/icons';
import { mascot } from '../../components/mascot';
import { haptic } from '../../lib/haptics';
import type { PlanId } from '../../features/billing/usePro';
import { useOffering } from '../../features/billing/useOffering';
import { getPaywallPlans } from '../../features/billing/paywallPlans';
import { purchasePlan } from '../../features/billing/purchase';
import { restorePurchases } from '../../features/billing/restore';
import { BILLING_UNAVAILABLE_MESSAGE } from '../../features/billing/availability';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

const BENEFITS = [
  'Unlimited chunking and re-plans',
  'Quizzes, flashcards and audio recaps',
  'Syllabus scanning, no limits',
];

export default function Paywall() {
  const router = useRouter();
  const active = useRef(true);
  const billingLock = useRef(false);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const busy = purchasing || restoring;
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const insets = useSafeAreaInsets();
  const onwards = () => {
    active.current = false;
    useDraft.getState().complete();
    router.replace('/login');
  };

  const [plan, setPlan] = useState<PlanId>('yearly');
  const { data, isPending, isError, isFetching, refetch } = useOffering();
  const plans = isError ? null : getPaywallPlans(data);
  const selectedPackage = plans?.[plan].package;
  const choose = (next: PlanId) => {
    if (billingLock.current) return;
    haptic('select');
    setPlan(next);
  };

  const onContinue = async () => {
    if (!selectedPackage || isPending || billingLock.current || !active.current) return;
    billingLock.current = true;
    setPurchasing(true);
    setBillingMessage(null);
    try {
      haptic('press');
      const result = await purchasePlan(selectedPackage);
      if (!active.current) return;
      switch (result.status) {
        case 'purchased':
          onwards();
          break;
        case 'cancelled':
          break;
        case 'entitlement-inactive':
          setBillingMessage(
            'Your purchase completed, but Chunk Pro is not active yet. Please wait before trying again.',
          );
          break;
        case 'failed':
          setBillingMessage(
            result.reason === 'unavailable'
              ? BILLING_UNAVAILABLE_MESSAGE
              : 'We couldn’t complete your purchase. Please try again.',
          );
          break;
      }
    } catch {
      if (active.current)
        setBillingMessage('We couldn’t complete your purchase. Please try again.');
    } finally {
      billingLock.current = false;
      if (active.current) setPurchasing(false);
    }
  };

  const cardEdge = (selected: boolean) =>
    selected ? shadows.hardEdge(7, colors.goldEdge) : shadows.hardEdge(5, colors.edgeSand);

  const onRestore = async () => {
    if (billingLock.current || !active.current) return;
    billingLock.current = true;
    setRestoring(true);
    setBillingMessage(null);
    try {
      haptic('press');
      const result = await restorePurchases();
      if (!active.current) return;
      switch (result.status) {
        case 'restored':
          onwards();
          break;
        case 'entitlement-inactive':
          setBillingMessage('No active Chunk Pro purchase was found to restore.');
          break;
        case 'failed':
          setBillingMessage(
            result.reason === 'unavailable'
              ? BILLING_UNAVAILABLE_MESSAGE
              : 'We couldn’t restore your purchases. Please try again.',
          );
          break;
      }
    } catch {
      if (active.current)
        setBillingMessage('We couldn’t restore your purchases. Please try again.');
    } finally {
      billingLock.current = false;
      if (active.current) setRestoring(false);
    }
  };

  return (
    // One scrolling page, header and buttons included, so nothing is cut off.
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => {
              haptic('select');
              active.current = false;
              safeBack(router, '/progress-curve');
            }}
            style={styles.back}
          >
            <ChevronLeft size={18} color={colors.ink} strokeWidth={2.8} />
          </Pressable>

          <View style={[styles.proBadge, shadows.hardEdge(4, colors.goldEdge)]}>
            <Text style={styles.proLabel}>PRO</Text>
          </View>
        </View>

        <AppImage source={mascot.paywall} style={styles.art} resizeMode="contain" />

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
            <Pressable
              accessibilityRole="button"
              disabled={isFetching}
              accessibilityState={{ disabled: isFetching }}
              onPress={() => {
                void refetch();
              }}
              style={styles.decline}
            >
              <Text style={styles.declineLabel}>{isFetching ? 'RETRYING…' : 'TRY AGAIN'}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.plans} accessibilityRole="radiogroup">
            <Pressable
              accessibilityRole="radio"
              disabled={busy}
              accessibilityState={{ checked: plan === 'yearly', disabled: busy }}
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
                  <Text style={styles.planDetail}>{plans.yearly.detail}</Text>
                </View>
                <View style={styles.planPriceBlock}>
                  <Text style={styles.planPrice}>{plans.yearly.priceLabel}</Text>
                </View>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="radio"
              disabled={busy}
              accessibilityState={{ checked: plan === 'monthly', disabled: busy }}
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
        <View style={styles.footer}>
          <Text style={styles.footnote}>Continue to purchase your selected plan.</Text>
          {billingMessage ? (
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={styles.footnote}
            >
              {billingMessage}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={!selectedPackage || isPending || busy}
            accessibilityState={{
              disabled: !selectedPackage || isPending || busy,
              busy: purchasing,
            }}
            onPress={onContinue}
            style={[styles.cta, shadows.hardEdge(6), !selectedPackage && { opacity: 0.5 }]}
          >
            {purchasing ? <ActivityIndicator color={colors.ink} /> : null}
            <Text style={styles.ctaLabel}>{purchasing ? 'PROCESSING…' : 'CONTINUE'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onRestore}
            disabled={busy}
            accessibilityState={{ disabled: busy, busy: restoring }}
            style={styles.decline}
          >
            {restoring ? <ActivityIndicator color={colors.muted} /> : null}
            <Text style={styles.declineLabel}>
              {restoring ? 'RESTORING…' : 'RESTORE PURCHASES'}
            </Text>
          </Pressable>

          <Pressable accessibilityRole="button" onPress={onwards} style={styles.decline}>
            <Text style={styles.declineLabel}>NO THANKS</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
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
  // flexGrow keeps the buttons at the bottom when everything fits.
  scroll: { flexGrow: 1 },
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
  footer: { marginTop: 'auto', paddingTop: 24, paddingHorizontal: 24, paddingBottom: 26 },
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
