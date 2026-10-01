import { StyleSheet } from 'react-native';
import { AppImage } from '../../../components/ui/AppImage';
import React from 'react';
import RootLayout from '../../../app/_layout';
import Startup from '../../../app/index';
import { useSession, SessionProvider } from '../../auth/SessionProvider';
import { useFonts } from '@expo-google-fonts/baloo-2';
import { usePathname, Stack, Redirect } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { SPLASH_FADE_MS, SPLASH_MAX_MS, SPLASH_MIN_MS } from '../StartupSplash';
const { act, create } = require('react-test-renderer');
jest.mock('@expo-google-fonts/baloo-2', () => ({ useFonts: jest.fn() }));
jest.mock('@expo-google-fonts/nunito', () => ({}));
jest.mock('expo-router', () => ({ usePathname: jest.fn(), Stack: () => null, Redirect: () => null }));
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));
jest.mock('react-native-gesture-handler', () => ({ GestureHandlerRootView: ({ children }: any) => children }));
jest.mock('@tanstack/react-query', () => ({ QueryClientProvider: ({ children }: any) => children }));
jest.mock('../../../lib/queryClient', () => ({ queryClient: {} }));
// Settles synchronously so image preloading never holds the splash in these tests.
jest.mock('../../../lib/preloadImages', () => {
  const settled: any = { catch: () => settled, finally: (done: () => void) => { done(); return settled; } };
  return { preloadImages: () => settled };
});
jest.mock('../../../components/ErrorBoundary', () => ({ ErrorBoundary: ({ children }: any) => children }));
jest.mock('../../ai/AiConsentSync', () => ({ AiConsentSync: () => null }));
jest.mock('../../auth/SessionProvider', () => ({ SessionProvider: ({ children }: any) => children, useSession: jest.fn() }));
let tree: any;
const fonts = (ready: boolean, error: Error | null = null) => jest.mocked(useFonts).mockReturnValue([ready, error]);
const path = (value: string) => jest.mocked(usePathname).mockReturnValue(value as ReturnType<typeof usePathname>);
const splash = () => tree.root.findAllByProps({ testID: 'startup-splash' });
function renderRoot() { act(() => { tree = create(<RootLayout />); }); }
function updateRoot() { act(() => tree.update(<RootLayout />)); }
function layout() { act(() => tree.root.findByType(GestureHandlerRootView).props.onLayout()); }
function advance(ms: number) { act(() => { jest.advanceTimersByTime(ms); }); }
beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks(); fonts(true); path('/');
  jest.mocked(useSession).mockReturnValue({ loading: true, session: null } as ReturnType<typeof useSession>);
});
afterEach(() => { if (tree) act(() => tree.unmount()); tree = undefined; jest.useRealTimers(); });

test('splash renders the design and takes over from the native splash', () => {
  renderRoot();
  expect(splash().length).toBeGreaterThan(0);
  expect(StyleSheet.flatten(splash()[0].props.style).backgroundColor).toBe('#FA7814');
  const image = tree.root.findByType(AppImage);
  expect(image.props.source).toEqual(require('../../../../assets/images/splash-logo.png'));
  expect(image.props.resizeMode).toBe('contain');
  act(() => splash()[0].props.onLayout());
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});
test('stays for the minimum even when startup is instant, then fades out', () => {
  path('/welcome'); renderRoot(); layout();
  advance(SPLASH_MIN_MS - 50);
  expect(splash().length).toBeGreaterThan(0);
  advance(50 + SPLASH_FADE_MS + 50);
  expect(splash()).toHaveLength(0);
});
test('holds over the index gate until the route is decided', () => {
  renderRoot(); layout();
  advance(SPLASH_MIN_MS + SPLASH_FADE_MS + 50);
  expect(splash().length).toBeGreaterThan(0);
  path('/home'); updateRoot();
  advance(SPLASH_FADE_MS + 50);
  expect(splash()).toHaveLength(0);
});
test('holds while fonts load', () => {
  fonts(false); path('/welcome'); renderRoot(); layout();
  expect(tree.root.findByType(SessionProvider)).toBeTruthy();
  expect(tree.root.findAllByType(Stack)).toHaveLength(0);
  advance(SPLASH_MIN_MS + SPLASH_FADE_MS + 50);
  expect(splash().length).toBeGreaterThan(0);
  fonts(false, new Error('font unavailable')); updateRoot();
  expect(tree.root.findByType(Stack)).toBeTruthy();
  advance(SPLASH_FADE_MS + 50);
  expect(splash()).toHaveLength(0);
});
test('never stays past the maximum', () => {
  fonts(false); renderRoot(); layout();
  advance(SPLASH_MAX_MS);
  advance(SPLASH_FADE_MS + 50);
  expect(splash()).toHaveLength(0);
});
test('first screen appears without animation, later screens fade', () => {
  renderRoot(); layout();
  expect(tree.root.findByType(Stack).props.screenOptions.animation).toBe('none');
  path('/welcome'); updateRoot();
  expect(tree.root.findByType(Stack).props.screenOptions.animation).toBe('fade');
});
test('direct OAuth login link is not redirected', () => {
  path('/login'); renderRoot(); layout();
  expect(tree.root.findAllByType(Redirect)).toHaveLength(0);
});
test.each([
  [true, null, null],
  [true, { user: { id: 'test-user' } }, null],
  [false, null, '/welcome'],
  [false, { user: { id: 'test-user' } }, '/home'],
] as const)('startup preserves main routing (loading=%s)', (loading, session, destination) => {
  jest.mocked(useSession).mockReturnValue({ loading, session } as ReturnType<typeof useSession>);
  act(() => { tree = create(<Startup />); });
  if (destination) expect(tree.root.findByType(Redirect).props.href).toBe(destination);
  else expect(tree.toJSON()).toBeNull();
});
