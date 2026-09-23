import React from 'react';
import Paywall from '../../../app/(onboarding)/paywall';
import { useOffering } from '../useOffering';

const { act, create } = require('react-test-renderer');
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace, back: jest.fn() }) }));
jest.mock('../useOffering', () => ({ useOffering: jest.fn() }));
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
  jest.clearAllMocks();
  jest.mocked(useOffering).mockReturnValue(state());
});
afterEach(() => { if (tree) act(() => tree.unmount()); tree = undefined; });

test('shows localized prices, preserves selection, and continues without a purchase claim', () => {
  act(() => { tree = create(<Paywall />); });
  const radios = [radio('12 months'), radio('1 month,')];
  expect(radios[0].props.accessibilityState.checked).toBe(true);
  expect(radios[0].props.accessibilityLabel).toContain('84,00 €');
  expect(radios[1].props.accessibilityLabel).toContain('9,00 €');
  act(() => radios[1].props.onPress());
  expect(radios[1].props.accessibilityState.checked).toBe(true);
  expect(radios[0].props.accessibilityState.checked).toBe(false);
  expect(JSON.stringify(tree.toJSON())).not.toMatch(/days free|FREE WEEK|27%|\$7\.99/);
  act(() => button('CONTINUE').props.onPress());
  expect(mockReplace).toHaveBeenCalledWith('/login');
});

test('loading disables continue while preserving the skip action', () => {
  jest.mocked(useOffering).mockReturnValue(state({ data: undefined, isPending: true, isFetching: true }));
  act(() => { tree = create(<Paywall />); });
  expect(JSON.stringify(tree.toJSON())).toContain('Loading plans');
  expect(button('CONTINUE').props.disabled).toBe(true);
  act(() => button('CONTINUE').props.onPress());
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
