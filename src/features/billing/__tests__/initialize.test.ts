jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { isConfigured: jest.fn(), configure: jest.fn() },
}));
jest.mock('../../../lib/env', () => ({
  env: { revenueCatPublicSdkKey: jest.fn() },
}));

function setup() {
  const Purchases = require('react-native-purchases').default;
  const { env } = require('../../../lib/env');
  const { initializeRevenueCat } = require('../initialize');
  Purchases.isConfigured.mockResolvedValue(false);
  env.revenueCatPublicSdkKey.mockReturnValue('test_fixture_not_a_real_key');
  return { Purchases, env, initializeRevenueCat };
}

beforeEach(() => jest.resetModules());

test('configures anonymously with the environment accessor', async () => {
  const { Purchases, env, initializeRevenueCat } = setup();
  await initializeRevenueCat();
  expect(env.revenueCatPublicSdkKey).toHaveBeenCalledTimes(1);
  expect(Purchases.configure).toHaveBeenCalledWith({ apiKey: 'test_fixture_not_a_real_key' });
});

test('shares concurrent initialization and prevents subsequent configuration', async () => {
  const { Purchases, initializeRevenueCat } = setup();
  const first = initializeRevenueCat();
  expect(initializeRevenueCat()).toBe(first);
  await first;
  await initializeRevenueCat();
  expect(Purchases.isConfigured).toHaveBeenCalledTimes(1);
  expect(Purchases.configure).toHaveBeenCalledTimes(1);
});

test('does not reconfigure an existing SDK instance', async () => {
  const { Purchases, env, initializeRevenueCat } = setup();
  Purchases.isConfigured.mockResolvedValue(true);
  await initializeRevenueCat();
  expect(Purchases.configure).not.toHaveBeenCalled();
  expect(env.revenueCatPublicSdkKey).not.toHaveBeenCalled();
});

test('missing configuration does not configure the SDK and can be retried', async () => {
  const { Purchases, env, initializeRevenueCat } = setup();
  env.revenueCatPublicSdkKey.mockImplementationOnce(() => { throw new Error('Missing key'); });
  await expect(initializeRevenueCat()).rejects.toThrow('RevenueCat initialization failed.');
  expect(Purchases.configure).not.toHaveBeenCalled();
  await initializeRevenueCat();
  expect(Purchases.configure).toHaveBeenCalledTimes(1);
});

test('does not expose SDK error details and permits retry after failure', async () => {
  const { Purchases, initializeRevenueCat } = setup();
  Purchases.configure.mockImplementationOnce(() => { throw new Error('sensitive SDK details'); });
  await expect(initializeRevenueCat()).rejects.toThrow(
    'RevenueCat initialization failed. Check the local billing configuration.',
  );
  await initializeRevenueCat();
  expect(Purchases.configure).toHaveBeenCalledTimes(2);
});
