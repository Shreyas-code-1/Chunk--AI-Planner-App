import type { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';

import { isBillingAvailable } from './availability';
import { sampleOfferings } from './sampleOffering';
import { getPurchases } from './sdk';

import { revenueCatConfig } from './config';
import { initializeRevenueCat } from './initialize';

export type OfferingErrorCode = 'initialization' | 'sdk' | 'missing-offering' | 'missing-package';

export class OfferingError extends Error {
  constructor(public readonly code: OfferingErrorCode, message: string) {
    super(message);
    this.name = 'OfferingError';
  }
}

function mapPackage(pkg: PurchasesPackage) {
  const product = pkg.product;
  return {
    // Preserve the actual SDK package, including its offering context, for later purchases.
    package: pkg,
    productIdentifier: product.identifier,
    title: product.title,
    description: product.description,
    price: product.price,
    priceString: product.priceString,
    currencyCode: product.currencyCode,
    subscriptionPeriod: product.subscriptionPeriod,
    pricePerMonth: product.pricePerMonth,
    pricePerMonthString: product.pricePerMonthString,
    // Offer metadata only; presence does not establish this user's trial eligibility.
    introPrice: product.introPrice,
  };
}

export function mapChunkOffering(offerings: PurchasesOfferings) {
  const id = revenueCatConfig.offeringIdentifier;
  const offering = offerings.all[id];
  if (!offering || offering.identifier !== id) {
    throw new OfferingError('missing-offering', `RevenueCat offering "${id}" is unavailable.`);
  }
  const find = (identifier: string) => {
    const pkg = offering.availablePackages.find((candidate) => candidate.identifier === identifier);
    if (!pkg) {
      throw new OfferingError('missing-package', `RevenueCat package "${identifier}" is unavailable.`);
    }
    return mapPackage(pkg);
  };
  return {
    offering,
    monthly: find(revenueCatConfig.packageIdentifiers.monthly),
    annual: find(revenueCatConfig.packageIdentifiers.annual),
  };
}

export type ChunkOffering = ReturnType<typeof mapChunkOffering>;

export async function fetchChunkOffering(): Promise<ChunkOffering> {
  // Expo Go: the board's prices, so the paywall renders for demos. Nothing can be bought.
  if (!isBillingAvailable()) return mapChunkOffering(sampleOfferings());
  try {
    await initializeRevenueCat();
  } catch {
    throw new OfferingError('initialization', 'RevenueCat is not ready to load offerings.');
  }
  let offerings: PurchasesOfferings;
  try {
    offerings = await getPurchases().getOfferings();
  } catch {
    // Do not expose raw SDK errors or configuration values to screens/logs.
    throw new OfferingError('sdk', 'RevenueCat offerings could not be loaded. Please retry.');
  }
  return mapChunkOffering(offerings);
}
