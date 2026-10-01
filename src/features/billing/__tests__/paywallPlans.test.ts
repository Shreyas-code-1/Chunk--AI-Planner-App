import type { ChunkOffering } from '../offerings';
import { getPaywallPlans } from '../paywallPlans';

function fixture() {
  return {
    annual: { package: { identifier: '$rc_annual' }, subscriptionPeriod: 'P1Y',
      priceString: '84,00 €', pricePerMonthString: '7,00 €' },
    monthly: { package: { identifier: '$rc_monthly' }, subscriptionPeriod: 'P1M',
      priceString: '9,00 €' },
  } as unknown as ChunkOffering;
}

test('maps yearly and monthly selections to the original SDK packages', () => {
  const offering = fixture();
  const plans = getPaywallPlans(offering)!;
  expect(plans.yearly.package).toBe(offering.annual.package);
  expect(plans.monthly.package).toBe(offering.monthly.package);
});

test('uses localized prices without currency or savings assumptions', () => {
  const plans = getPaywallPlans(fixture())!;
  expect(plans.yearly.priceLabel).toBe('7,00 € / MO');
  expect(plans.yearly.detail).toBe('84,00 € billed yearly');
  expect(plans.monthly.priceLabel).toBe('9,00 € / MO');
});

test('falls back to the actual annual price when a monthly equivalent is absent', () => {
  const offering = fixture();
  offering.annual.pricePerMonthString = null;
  expect(getPaywallPlans(offering)?.yearly.priceLabel).toBe('84,00 € / YEAR');
});

test('accepts a twelve-month annual period', () => {
  const offering = fixture();
  offering.annual.subscriptionPeriod = 'P12M';
  expect(getPaywallPlans(offering)).not.toBeNull();
});

test('unavailable data has no selectable plans', () => {
  expect(getPaywallPlans(undefined)).toBeNull();
});

test('rejects inconsistent billing periods', () => {
  const offering = fixture();
  offering.monthly.subscriptionPeriod = 'P1W';
  expect(getPaywallPlans(offering)).toBeNull();
});

test('rejects missing localized prices', () => {
  const offering = fixture();
  offering.annual.priceString = '';
  expect(getPaywallPlans(offering)).toBeNull();
});

test('rejects swapped SDK packages', () => {
  const offering = fixture();
  offering.annual.package = offering.monthly.package;
  expect(getPaywallPlans(offering)).toBeNull();
});
