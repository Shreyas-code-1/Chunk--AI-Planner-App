import React from 'react';
import RootLayout from '../../../app/_layout';
import Startup from '../../../app/index';
import { useSession, SessionProvider } from '../../auth/SessionProvider';
import { initializeRevenueCat } from '../../billing/initialize';
import { RevenueCatIdentitySync } from '../../billing/RevenueCatIdentitySync';
import { useFonts } from '@expo-google-fonts/baloo-2';
import { usePathname, Stack, Redirect } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
const { act, create } = require('react-test-renderer');
jest.mock('@expo-google-fonts/baloo-2', () => ({ useFonts: jest.fn() }));
jest.mock('@expo-google-fonts/nunito', () => ({}));
jest.mock('expo-router', () => ({ usePathname: jest.fn(), Stack: () => null, Redirect: () => null }));
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));
jest.mock('react-native-gesture-handler', () => ({ GestureHandlerRootView: ({ children }: any) => children }));
jest.mock('@tanstack/react-query', () => ({ QueryClientProvider: ({ children }: any) => children }));
jest.mock('../../../lib/queryClient', () => ({ queryClient: {} }));
jest.mock('../../../components/ErrorBoundary', () => ({ ErrorBoundary: ({ children }: any) => children }));
jest.mock('../../auth/SessionProvider', () => ({ SessionProvider: ({ children }: any) => children, useSession: jest.fn() }));
jest.mock('../../billing/initialize', () => ({ initializeRevenueCat: jest.fn() }));
jest.mock('../../billing/RevenueCatIdentitySync', () => ({ RevenueCatIdentitySync: () => null }));
let tree: any;
const fonts = (ready: boolean, error: Error | null = null) => jest.mocked(useFonts).mockReturnValue([ready, error]);
const path = (value: string) => jest.mocked(usePathname).mockReturnValue(value as ReturnType<typeof usePathname>);
function renderRoot() { act(() => { tree = create(<RootLayout />); }); }
function updateRoot() { act(() => tree.update(<RootLayout />)); }
function layout() { act(() => tree.root.findByType(GestureHandlerRootView).props.onLayout()); }
beforeEach(() => {
  jest.clearAllMocks(); fonts(true); path('/');
  jest.mocked(initializeRevenueCat).mockReturnValue(new Promise(() => {}));
});
afterEach(() => { if (tree) act(() => tree.unmount()); tree = undefined; });
test('session restoration and billing mount while fonts are still loading', () => {
  fonts(false); renderRoot(); layout();
  expect(tree.root.findByType(SessionProvider)).toBeTruthy();
  expect(tree.root.findByType(RevenueCatIdentitySync)).toBeTruthy();
  expect(initializeRevenueCat).toHaveBeenCalledTimes(1);
  expect(tree.root.findAllByType(Stack)).toHaveLength(0);
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
});
test('keeps native splash over index, then reveals destination without waiting for RevenueCat', () => {
  renderRoot(); layout();
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  expect(tree.root.findByType(Stack).props.screenOptions.animation).toBe('none');
  path('/welcome'); updateRoot();
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  path('/login'); updateRoot();
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});
test('waits for root layout before revealing the destination', () => {
  path('/home'); renderRoot();
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  layout(); expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});
test('font failure releases startup using fallback fonts', () => {
  fonts(false); path('/welcome'); renderRoot(); layout();
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  fonts(false, new Error('font unavailable')); updateRoot();
  expect(tree.root.findByType(Stack)).toBeTruthy();
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});
test('direct OAuth login link is not redirected or held for session resolution', () => {
  path('/login'); renderRoot(); layout();
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  expect(tree.root.findAllByType(Redirect)).toHaveLength(0);
});
test.each([
  ['unresolved', null, null],
  ['signed-out', null, '/welcome'],
  ['error', null, '/welcome'],
  ['authenticated', { user: { id: 'test-user' } }, '/home'],
  ['authenticated', null, '/welcome'],
] as const)('startup routes %s safely and without a timer', (status, session, destination) => {
  jest.mocked(useSession).mockReturnValue({ status, session } as ReturnType<typeof useSession>);
  act(() => { tree = create(<Startup />); });
  if (destination) expect(tree.root.findByType(Redirect).props.href).toBe(destination);
  else expect(tree.toJSON()).toBeNull();
});
