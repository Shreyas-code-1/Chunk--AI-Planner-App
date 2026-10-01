/**
 * Expo Go stand-in for RevenueCat's offerings, shaped like the SDK's so the
 * real mapping code runs unchanged. Prices are the board's 2.16 values
 * ($7.99/mo billed $95.88 yearly, $10.99 monthly). Never used in a native
 * build, and nothing built from it can be purchased (`purchasePlan` refuses).
 */

import type { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';

import { revenueCatConfig } from './config';

function samplePackage(
  identifier: string,
  product: {
    identifier: string;
    price: number;
    priceString: string;
    subscriptionPeriod: string;
    pricePerMonth: number;
    pricePerMonthString: string;
  },
): PurchasesPackage {
  return {
    identifier,
    packageType: identifier === revenueCatConfig.packageIdentifiers.annual ? 'ANNUAL' : 'MONTHLY',
    offeringIdentifier: revenueCatConfig.offeringIdentifier,
    product: {
      ...product,
      title: 'Chunk Pro',
      description: 'Chunk Pro (sample offering in Expo Go)',
      currencyCode: 'USD',
      introPrice: null,
    },
  } as unknown as PurchasesPackage;
}

export function sampleOfferings(): PurchasesOfferings {
  const annual = samplePackage(revenueCatConfig.packageIdentifiers.annual, {
    identifier: 'chunk_pro_annual_sample',
    price: 95.88,
    priceString: '$95.88',
    subscriptionPeriod: 'P1Y',
    pricePerMonth: 7.99,
    pricePerMonthString: '$7.99',
  });
  const monthly = samplePackage(revenueCatConfig.packageIdentifiers.monthly, {
    identifier: 'chunk_pro_monthly_sample',
    price: 10.99,
    priceString: '$10.99',
    subscriptionPeriod: 'P1M',
    pricePerMonth: 10.99,
    pricePerMonthString: '$10.99',
  });
  const offering = {
    identifier: revenueCatConfig.offeringIdentifier,
    serverDescription: 'Sample offering (Expo Go)',
    availablePackages: [annual, monthly],
    annual,
    monthly,
  };
  return {
    all: { [revenueCatConfig.offeringIdentifier]: offering },
    current: offering,
  } as unknown as PurchasesOfferings;
}
