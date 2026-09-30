import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Image, StyleSheet } from 'react-native';
jest.mock('expo-constants', () => ({ __esModule: true, default: { executionEnvironment: 'bare' }, ExecutionEnvironment: { StoreClient: 'storeClient', Bare: 'bare', Standalone: 'standalone' } }));
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
  Constants.executionEnvironment = ExecutionEnvironment.Bare;
  jest.mocked(useSession).mockReturnValue({ status: 'unresolved', session: null } as ReturnType<typeof useSession>);
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

const preview = () => tree.root.findAllByProps({ testID: 'expo-go-startup-preview' });
function go() { Constants.executionEnvironment = ExecutionEnvironment.StoreClient; }
function resolved(status: 'signed-out' | 'authenticated' | 'error') {
  jest.mocked(useSession).mockReturnValue({ status, session: status === 'authenticated' ? { user: { id: 'test-user' } } : null } as ReturnType<typeof useSession>);
}
test('Expo Go shows artwork on first render before fonts and session resolve', () => {
  go(); fonts(false); renderRoot();
  expect(preview().length).toBeGreaterThan(0);
  expect(StyleSheet.flatten(preview()[0].props.style).backgroundColor).toBe('#FCF1DC');
  const image = tree.root.findByType(Image);
  expect(image.props.source).toEqual(require('../../../../assets/images/splash-beaver.png'));
  expect(image.props.resizeMode).toBe('contain');
  act(() => preview()[0].props.onLayout());
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});
test.each(['signed-out', 'authenticated', 'error'] as const)('Expo Go removes preview immediately when fonts and session resolve: %s', status => {
  go(); fonts(false); renderRoot();
  resolved(status); updateRoot();
  expect(preview().length).toBeGreaterThan(0);
  fonts(true); updateRoot();
  expect(preview()).toHaveLength(0);
});
test('Expo Go waits for pending session after fonts, but never adds a minimum duration', () => {
  go(); renderRoot(); expect(preview().length).toBeGreaterThan(0);
  resolved('signed-out'); updateRoot(); expect(preview()).toHaveLength(0);
});
test('Expo Go font error releases preview when session resolves', () => {
  go(); fonts(false); resolved('signed-out'); renderRoot();
  fonts(false, new Error('font unavailable')); updateRoot();
  expect(preview()).toHaveLength(0);
});
test('Expo Go never displays preview when startup is already ready', () => {
  go(); resolved('signed-out'); renderRoot(); expect(preview()).toHaveLength(0);
});
test('Expo Go direct OAuth link is not blocked by pending auth', () => {
  go(); path('/login'); renderRoot(); layout();
  expect(preview()).toHaveLength(0);
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});
test.each([ExecutionEnvironment.Bare, ExecutionEnvironment.Standalone])('native %s never renders the preview even while startup is pending', environment => {
  Constants.executionEnvironment = environment;
  fonts(false); renderRoot(); layout();
  expect(preview()).toHaveLength(0);
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
});
