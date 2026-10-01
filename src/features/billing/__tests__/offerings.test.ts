import { QueryClient, QueryObserver } from '@tanstack/react-query';
import Purchases, { type PurchasesOfferings, type PurchasesPackage } from 'react-native-purchases';

import { initializeRevenueCat } from '../initialize';
import { fetchChunkOffering, mapChunkOffering } from '../offerings';
import { chunkOfferingQueryOptions } from '../useOffering';

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { getOfferings: jest.fn() },
}));
jest.mock('../initialize', () => ({ initializeRevenueCat: jest.fn() }));

function fixture(): PurchasesOfferings {
  const pkg = (identifier: string, productId: string, price: number, period: string) => ({
    identifier,
    product: {
      identifier: productId, title: productId, description: 'Store description',
      price, priceString: `${price} €`, currencyCode: 'EUR', subscriptionPeriod: period,
      pricePerMonth: null, pricePerMonthString: null, introPrice: null,
    },
  } as PurchasesPackage);
  return {
    current: null,
    all: { default: { identifier: 'default', availablePackages: [
      pkg('$rc_annual', 'yearly', 84, 'P1Y'),
      pkg('$rc_monthly', 'monthly', 9, 'P1M'),
    ] } },
  } as unknown as PurchasesOfferings;
}

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(initializeRevenueCat).mockResolvedValue(undefined);
});

test('selects default by identifier and maps packages regardless of ordering', () => {
  const source = fixture();
  const mapped = mapChunkOffering(source);
  expect(mapped.offering).toBe(source.all.default);
  expect(mapped.monthly.package).toBe(source.all.default.availablePackages[1]);
  expect(mapped.annual.package).toBe(source.all.default.availablePackages[0]);
  expect(mapped.monthly.productIdentifier).toBe('monthly');
  expect(mapped.annual.productIdentifier).toBe('yearly');
});

test('preserves store-localized display data and absent introductory pricing', () => {
  const mapped = mapChunkOffering(fixture());
  expect(mapped.monthly).toMatchObject({ price: 9, priceString: '9 €', currencyCode: 'EUR',
    subscriptionPeriod: 'P1M', pricePerMonthString: null, introPrice: null });
  expect(mapped.annual.priceString).toBe('84 €');
});

test('does not substitute another current offering when default is missing', () => {
  const source = fixture();
  const withoutDefault = { ...source, current: source.all.default, all: {} };
  expect(() => mapChunkOffering(withoutDefault)).toThrow('offering "default" is unavailable');
});

test.each(['$rc_monthly', '$rc_annual'])('reports a missing %s package', (id) => {
  const source = fixture();
  source.all.default.availablePackages.splice(
    source.all.default.availablePackages.findIndex((pkg) => pkg.identifier === id), 1,
  );
  expect(() => mapChunkOffering(source)).toThrow(`package "${id}" is unavailable`);
});

test('waits for initialization before requesting offerings', async () => {
  let ready!: () => void;
  jest.mocked(initializeRevenueCat).mockReturnValue(new Promise<void>((resolve) => { ready = resolve; }));
  jest.mocked(Purchases.getOfferings).mockResolvedValue(fixture());
  const pending = fetchChunkOffering();
  expect(Purchases.getOfferings).not.toHaveBeenCalled();
  ready();
  expect((await pending).monthly.productIdentifier).toBe('monthly');
  expect(Purchases.getOfferings).toHaveBeenCalledTimes(1);
});

test('initialization failure prevents fetching', async () => {
  jest.mocked(initializeRevenueCat).mockRejectedValue(new Error('private details'));
  await expect(fetchChunkOffering()).rejects.toMatchObject({ code: 'initialization' });
  expect(Purchases.getOfferings).not.toHaveBeenCalled();
});

test('SDK errors are exposed as sanitized billing errors', async () => {
  jest.mocked(Purchases.getOfferings).mockRejectedValue(new Error('private details'));
  await expect(fetchChunkOffering()).rejects.toMatchObject({
    code: 'sdk', message: 'RevenueCat offerings could not be loaded. Please retry.',
  });
});

test('query exposes loading, error, and successful retry while retaining SDK packages', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  const observer = new QueryObserver(client, chunkOfferingQueryOptions);
  const source = fixture();
  jest.mocked(Purchases.getOfferings).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(source);
  const unsubscribe = observer.subscribe(() => {});
  try {
    expect(observer.getCurrentResult().isLoading).toBe(true);
    const failed = await observer.refetch();
    expect(failed.isError).toBe(true);
    const success = await observer.refetch();
    expect(success.isSuccess).toBe(true);
    expect(success.isLoading).toBe(false);
    expect(success.data?.annual.package).toBe(source.all.default.availablePackages[0]);
  } finally {
    unsubscribe();
    client.clear();
  }
});
