import { revenueCatConfig } from './config';
import type { ChunkOffering } from './offerings';

/** Avoid labeling a misconfigured store product with the wrong billing period. */
export function getPaywallPlans(offering: ChunkOffering | undefined) {
  if (!offering) return null;
  const { annual, monthly } = offering;
  if (
    annual.package.identifier !== revenueCatConfig.packageIdentifiers.annual ||
    monthly.package.identifier !== revenueCatConfig.packageIdentifiers.monthly ||
    !['P1Y', 'P12M'].includes(annual.subscriptionPeriod ?? '') ||
    monthly.subscriptionPeriod !== 'P1M' ||
    !annual.priceString?.trim() || !monthly.priceString?.trim()
  ) return null;

  return {
    yearly: {
      package: annual.package,
      priceLabel: annual.pricePerMonthString
        ? `${annual.pricePerMonthString} / MO`
        : `${annual.priceString} / YEAR`,
      detail: `${annual.priceString} billed yearly`,
      accessibilityLabel: `12 months, ${annual.priceString} billed yearly`,
    },
    monthly: {
      package: monthly.package,
      priceLabel: `${monthly.priceString} / MO`,
      detail: 'Billed monthly',
      accessibilityLabel: `1 month, ${monthly.priceString} billed monthly`,
    },
  };
}
