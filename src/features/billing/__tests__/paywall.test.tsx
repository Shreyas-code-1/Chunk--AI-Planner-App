import React from 'react';
import Paywall from '../../../app/(onboarding)/paywall';
import { useOffering } from '../useOffering';
import { purchasePlan, type PurchaseResult } from '../purchase';
import { restorePurchases, type RestoreResult } from '../restore';

const { act, create } = require('react-test-renderer');
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace, back: jest.fn() }) }));
jest.mock('../useOffering', () => ({ useOffering: jest.fn() }));
jest.mock('../purchase', () => ({ purchasePlan: jest.fn() }));
jest.mock('../restore', () => ({ restorePurchases: jest.fn() }));
jest.mock('../../../lib/haptics', () => ({ haptic: jest.fn() }));
jest.mock('../../../components/ui/StrokedText', () => ({
  HighlightChip: ({ children }: { children: React.ReactNode }) => children,
}));

let tree: any;
const refetch = jest.fn();
function state(overrides = {}) {
  return {
    data: {
      annual: { package: { identifier: '$rc_annual' }, subscriptionPeriod: 'P1Y',
        priceString: '84,00 €', pricePerMonthString: '7,00 €' },
      monthly: { package: { identifier: '$rc_monthly' }, subscriptionPeriod: 'P1M',
        priceString: '9,00 €' },
    },
    isPending: false, isError: false, isFetching: false, refetch, ...overrides,
  } as unknown as ReturnType<typeof useOffering>;
}
function button(label: string) {
  return tree.root.findAll((node: any) =>
    node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function'
    && node.findAll((text: any) => text.props.children === label).length > 0)[0];
}
function radio(prefix: string) {
  return tree.root.findAll((node: any) => node.props.accessibilityRole === 'radio'
    && typeof node.props.onPress === 'function'
    && node.props.accessibilityLabel?.startsWith(prefix))[0];
}
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(useOffering).mockReturnValue(state());
  jest.mocked(purchasePlan).mockResolvedValue({ status: 'purchased' });
  jest.mocked(restorePurchases).mockResolvedValue({ status: 'restored' });
});
afterEach(() => { if (tree) act(() => tree.unmount()); tree = undefined; });

test('restore success navigates only after active entitlement is reported, even without offerings', async () => {
  jest.mocked(useOffering).mockReturnValue(state({ data: undefined, isError: true }));
  act(() => { tree = create(<Paywall />); });
  expect(mockReplace).not.toHaveBeenCalled();
  await act(async () => { await button('RESTORE PURCHASES').props.onPress(); });
  expect(restorePurchases).toHaveBeenCalledTimes(1);
  expect(mockReplace).toHaveBeenCalledWith('/login');
  expect(purchasePlan).not.toHaveBeenCalled();
});

test('inactive restore shows a friendly message without navigation or changing selection', async () => {
  jest.mocked(restorePurchases).mockResolvedValue({ status: 'entitlement-inactive' });
  act(() => { tree = create(<Paywall />); });
  act(() => radio('1 month,').props.onPress());
  await act(async () => { await button('RESTORE PURCHASES').props.onPress(); });
  expect(mockReplace).not.toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).toContain('No active Chunk Pro purchase was found to restore.');
  expect(radio('1 month,').props.accessibilityState.checked).toBe(true);
});

test('failed restore shows an error, then clears it when retrying', async () => {
  jest.mocked(restorePurchases).mockResolvedValueOnce({ status: 'failed', reason: 'restore' });
  act(() => { tree = create(<Paywall />); });
  await act(async () => { await button('RESTORE PURCHASES').props.onPress(); });
  expect(mockReplace).not.toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).toContain('We couldn’t restore your purchases.');
  await act(async () => { await button('RESTORE PURCHASES').props.onPress(); });
  expect(mockReplace).toHaveBeenCalledWith('/login');
  expect(JSON.stringify(tree.toJSON())).not.toContain('We couldn’t restore your purchases.');
});

test('pending restore blocks duplicate restores and purchases before and after rerender', async () => {
  let finish!: (result: RestoreResult) => void;
  jest.mocked(restorePurchases).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  act(() => { tree = create(<Paywall />); });
  const restore = button('RESTORE PURCHASES').props.onPress;
  const purchase = button('CONTINUE').props.onPress;
  let pending!: Promise<void>;
  act(() => { pending = restore(); void restore(); void purchase(); });
  expect(restorePurchases).toHaveBeenCalledTimes(1);
  expect(purchasePlan).not.toHaveBeenCalled();
  expect(button('RESTORING…').props.accessibilityState).toEqual({ disabled: true, busy: true });
  expect(button('CONTINUE').props.disabled).toBe(true);
  await act(async () => { await button('CONTINUE').props.onPress(); });
  expect(purchasePlan).not.toHaveBeenCalled();
  await act(async () => { finish({ status: 'entitlement-inactive' }); await pending; });
  expect(button('RESTORE PURCHASES').props.disabled).toBe(false);
  expect(button('CONTINUE').props.disabled).toBe(false);
});

test('pending purchase blocks restoration, and restore clears the old purchase error', async () => {
  let finish!: (result: PurchaseResult) => void;
  jest.mocked(purchasePlan).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  act(() => { tree = create(<Paywall />); });
  const restore = button('RESTORE PURCHASES').props.onPress;
  let pending!: Promise<void>;
  act(() => { pending = button('CONTINUE').props.onPress(); void restore(); });
  expect(restorePurchases).not.toHaveBeenCalled();
  expect(button('RESTORE PURCHASES').props.disabled).toBe(true);
  await act(async () => { finish({ status: 'failed', reason: 'purchase' }); await pending; });
  expect(JSON.stringify(tree.toJSON())).toContain('We couldn’t complete your purchase.');
  jest.mocked(restorePurchases).mockResolvedValue({ status: 'entitlement-inactive' });
  await act(async () => { await button('RESTORE PURCHASES').props.onPress(); });
  expect(JSON.stringify(tree.toJSON())).not.toContain('We couldn’t complete your purchase.');
});

test('starting a purchase clears a stale restore error', async () => {
  jest.mocked(restorePurchases).mockResolvedValue({ status: 'failed', reason: 'restore' });
  jest.mocked(purchasePlan).mockResolvedValue({ status: 'cancelled' });
  act(() => { tree = create(<Paywall />); });
  await act(async () => { await button('RESTORE PURCHASES').props.onPress(); });
  await act(async () => { await button('CONTINUE').props.onPress(); });
  expect(JSON.stringify(tree.toJSON())).not.toContain('We couldn’t restore your purchases.');
  expect(mockReplace).not.toHaveBeenCalled();
});

test('unexpected restore rejection remains retryable without exposing details', async () => {
  jest.mocked(restorePurchases).mockRejectedValue(new Error('private details'));
  act(() => { tree = create(<Paywall />); });
  await act(async () => { await button('RESTORE PURCHASES').props.onPress(); });
  expect(mockReplace).not.toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).toContain('We couldn’t restore your purchases.');
  expect(JSON.stringify(tree.toJSON())).not.toContain('private details');
  expect(button('RESTORE PURCHASES').props.disabled).toBe(false);
});

test('NO THANKS during restoration preserves skip behavior and ignores late completion', async () => {
  let finish!: (result: RestoreResult) => void;
  jest.mocked(restorePurchases).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  act(() => { tree = create(<Paywall />); });
  let pending!: Promise<void>;
  act(() => { pending = button('RESTORE PURCHASES').props.onPress(); });
  act(() => button('NO THANKS').props.onPress());
  await act(async () => { finish({ status: 'restored' }); await pending; });
  expect(mockReplace).toHaveBeenCalledTimes(1);
  expect(mockReplace).toHaveBeenCalledWith('/login');
});

test('shows localized prices, preserves selection, and purchases the monthly package before navigating', async () => {
  act(() => { tree = create(<Paywall />); });
  const radios = [radio('12 months'), radio('1 month,')];
  expect(radios[0].props.accessibilityState.checked).toBe(true);
  expect(radios[0].props.accessibilityLabel).toContain('84,00 €');
  expect(radios[1].props.accessibilityLabel).toContain('9,00 €');
  act(() => radios[1].props.onPress());
  expect(radios[1].props.accessibilityState.checked).toBe(true);
  expect(radios[0].props.accessibilityState.checked).toBe(false);
  expect(JSON.stringify(tree.toJSON())).not.toMatch(/days free|FREE WEEK|27%|\$7\.99/);
  await act(async () => { await button('CONTINUE').props.onPress(); });
  expect(purchasePlan).toHaveBeenCalledWith(jest.mocked(useOffering).mock.results[0].value.data.monthly.package);
  expect(mockReplace).toHaveBeenCalledWith('/login');
});

test('purchases the default yearly package and navigates only on success', async () => {
  act(() => { tree = create(<Paywall />); });
  expect(mockReplace).not.toHaveBeenCalled();
  await act(async () => { await button('CONTINUE').props.onPress(); });
  expect(jest.mocked(purchasePlan).mock.calls[0][0]).toBe(jest.mocked(useOffering).mock.results[0].value.data.annual.package);
  expect(mockReplace).toHaveBeenCalledWith('/login');
});

test('cancellation remains on the paywall without an error and preserves selection', async () => {
  jest.mocked(purchasePlan).mockResolvedValue({ status: 'cancelled' });
  act(() => { tree = create(<Paywall />); });
  act(() => radio('1 month,').props.onPress());
  await act(async () => { await button('CONTINUE').props.onPress(); });
  expect(mockReplace).not.toHaveBeenCalled();
  expect(radio('1 month,').props.accessibilityState.checked).toBe(true);
  expect(tree.root.findAll((node: any) => node.props.accessibilityRole === 'alert')).toHaveLength(0);
  expect(button('CONTINUE').props.disabled).toBe(false);
});

test('failed purchases show an error and allow an explicit retry', async () => {
  jest.mocked(purchasePlan).mockResolvedValueOnce({ status: 'failed', reason: 'purchase' });
  act(() => { tree = create(<Paywall />); });
  await act(async () => { await button('CONTINUE').props.onPress(); });
  expect(mockReplace).not.toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).toContain('Please try again.');
  expect(button('CONTINUE').props.disabled).toBe(false);
  await act(async () => { await button('CONTINUE').props.onPress(); });
  expect(purchasePlan).toHaveBeenCalledTimes(2);
  expect(mockReplace).toHaveBeenCalledWith('/login');
});

test('inactive entitlement explains that access is pending without navigating', async () => {
  jest.mocked(purchasePlan).mockResolvedValue({ status: 'entitlement-inactive' });
  act(() => { tree = create(<Paywall />); });
  await act(async () => { await button('CONTINUE').props.onPress(); });
  expect(mockReplace).not.toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).toContain('Chunk Pro is not active yet');
});

test('pending purchase disables the button and plan changes and blocks immediate duplicate taps', async () => {
  let finish!: (result: PurchaseResult) => void;
  jest.mocked(purchasePlan).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  act(() => { tree = create(<Paywall />); });
  const press = button('CONTINUE').props.onPress;
  let pending!: Promise<void>;
  act(() => { pending = press(); void press(); });
  expect(purchasePlan).toHaveBeenCalledTimes(1);
  expect(button('PROCESSING…').props.disabled).toBe(true);
  expect(button('PROCESSING…').props.accessibilityState.busy).toBe(true);
  act(() => radio('1 month,').props.onPress());
  expect(radio('12 months').props.accessibilityState.checked).toBe(true);
  expect(mockReplace).not.toHaveBeenCalled();
  await act(async () => { finish({ status: 'cancelled' }); await pending; });
  expect(button('CONTINUE').props.disabled).toBe(false);
});

test('unexpected rejection shows only a safe retryable error', async () => {
  jest.mocked(purchasePlan).mockRejectedValue(new Error('private details'));
  act(() => { tree = create(<Paywall />); });
  await act(async () => { await button('CONTINUE').props.onPress(); });
  expect(mockReplace).not.toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).toContain('Please try again.');
  expect(JSON.stringify(tree.toJSON())).not.toContain('private details');
});

test('NO THANKS during a pending purchase navigates once and ignores the late result', async () => {
  let finish!: (result: PurchaseResult) => void;
  jest.mocked(purchasePlan).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  act(() => { tree = create(<Paywall />); });
  let pending!: Promise<void>;
  act(() => { pending = button('CONTINUE').props.onPress(); });
  act(() => button('NO THANKS').props.onPress());
  await act(async () => { finish({ status: 'purchased' }); await pending; });
  expect(mockReplace).toHaveBeenCalledTimes(1);
  expect(mockReplace).toHaveBeenCalledWith('/login');
});

test('loading disables continue while preserving the skip action', async () => {
  jest.mocked(useOffering).mockReturnValue(state({ data: undefined, isPending: true, isFetching: true }));
  act(() => { tree = create(<Paywall />); });
  expect(JSON.stringify(tree.toJSON())).toContain('Loading plans');
  expect(button('CONTINUE').props.disabled).toBe(true);
  await act(async () => { await button('CONTINUE').props.onPress(); });
  expect(mockReplace).not.toHaveBeenCalled();
  act(() => button('NO THANKS').props.onPress());
  expect(mockReplace).toHaveBeenCalledWith('/login');
});

test('errors hide stale prices, disable continue, and offer retry', () => {
  jest.mocked(useOffering).mockReturnValue(state({ isError: true }));
  act(() => { tree = create(<Paywall />); });
  expect(JSON.stringify(tree.toJSON())).toContain('Plans are unavailable');
  expect(JSON.stringify(tree.toJSON())).not.toContain('84,00 €');
  expect(button('CONTINUE').props.disabled).toBe(true);
  act(() => button('TRY AGAIN').props.onPress());
  expect(refetch).toHaveBeenCalledTimes(1);
});
