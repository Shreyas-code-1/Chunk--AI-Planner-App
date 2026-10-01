import { useLocalDataReady } from '../../persistence/localData';
import { useDraft } from '../../onboarding/draft';
import { Image, StyleSheet } from 'react-native';
import React from 'react';
import RootLayout from '../../../app/_layout';
import Startup from '../../../app/index';
import { useSession, SessionProvider } from '../../auth/SessionProvider';
import { useFonts } from '@expo-google-fonts/baloo-2';
import { usePathname, Stack, Redirect } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import Constants, { ExecutionEnvironment } from 'expo-constants';
const { act, create } = require('react-test-renderer');
jest.mock('../../persistence/localData', () => ({ useLocalDataReady: jest.fn(), useOnboardingProgress: jest.fn() }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { executionEnvironment: 'standalone' }, ExecutionEnvironment: { StoreClient: 'storeClient', Standalone: 'standalone', Bare: 'bare' } }));
jest.mock('@expo-google-fonts/baloo-2', () => ({ useFonts: jest.fn() }));
jest.mock('@expo-google-fonts/nunito', () => ({}));
jest.mock('../../../lib/preloadImages', () => ({ preloadImages: jest.fn(async () => {}) }));
jest.mock('../../navigation/useAndroidBack', () => ({ useAndroidBack: jest.fn() }));
jest.mock('expo-router', () => ({ usePathname: jest.fn(), Stack: () => null, Redirect: () => null }));
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(async () => {}), hideAsync: jest.fn(async () => {}) }));
jest.mock('react-native-gesture-handler', () => ({ GestureHandlerRootView: ({ children }: any) => children }));
jest.mock('@tanstack/react-query', () => ({ QueryClientProvider: ({ children }: any) => children }));
jest.mock('../../../lib/queryClient', () => ({ queryClient: {} }));
jest.mock('../../../components/ErrorBoundary', () => ({ ErrorBoundary: ({ children }: any) => children }));
jest.mock('../../ai/AiConsentSync', () => ({ AiConsentSync: () => null }));
jest.mock('../../auth/SessionProvider', () => ({ SessionProvider: ({ children }: any) => children, useSession: jest.fn() }));
let tree: any;
const fonts = (ready: boolean, error: Error | null = null) => jest.mocked(useFonts).mockReturnValue([ready, error]);
const path = (value: string) => jest.mocked(usePathname).mockReturnValue(value as ReturnType<typeof usePathname>);
const splash = () => tree.root.findAllByProps({ testID: 'expo-go-startup-preview' });
function renderRoot() { act(() => { tree = create(<RootLayout />); }); }
function updateRoot() { act(() => tree.update(<RootLayout />)); }
function layout() { act(() => tree.root.findByType(GestureHandlerRootView).props.onLayout()); }
function advance(ms: number) { act(() => { jest.advanceTimersByTime(ms); }); }
beforeEach(() => {
  useDraft.getState().reset();
  jest.mocked(useLocalDataReady).mockReturnValue(true);
  Constants.executionEnvironment = ExecutionEnvironment.Standalone;
  jest.useFakeTimers(); jest.clearAllMocks(); fonts(true); path('/');
  jest.mocked(useSession).mockReturnValue({ loading: false, session: null } as ReturnType<typeof useSession>);
});
afterEach(() => { if (tree) act(() => tree.unmount()); tree = undefined; jest.useRealTimers(); });

test('native builds never mount a duplicate splash and reveal immediately when ready', () => {
  path('/welcome'); renderRoot(); layout();
  expect(splash()).toHaveLength(0);
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});
test.each(['fonts', 'session', 'data'])('native splash and screens wait for %s with no timeout', (pending) => {
  if (pending === 'fonts') fonts(false);
  if (pending === 'data') jest.mocked(useLocalDataReady).mockReturnValue(false);
  if (pending === 'session') jest.mocked(useSession).mockReturnValue({ loading: true, session: null } as ReturnType<typeof useSession>);
  path('/home'); renderRoot(); layout(); advance(10000);
  expect(tree.root.findAllByType(Stack)).toHaveLength(0);
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  fonts(true); jest.mocked(useLocalDataReady).mockReturnValue(true);
  jest.mocked(useSession).mockReturnValue({ loading: false, session: null } as ReturnType<typeof useSession>);
  updateRoot(); expect(tree.root.findByType(Stack)).toBeTruthy();
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});
test('index routing and root layout must settle before native splash hides', () => {
  renderRoot(); expect(SplashScreen.hideAsync).not.toHaveBeenCalled(); layout();
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled(); path('/home'); updateRoot();
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});
test('font failure permits startup without an artificial delay', () => {
  fonts(false, new Error('font unavailable')); path('/welcome'); renderRoot(); layout();
  expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
});
test.each(['fonts', 'session', 'data'])('Expo Go shows the beaver while %s is pending, then removes it immediately', (pending) => {
  Constants.executionEnvironment = ExecutionEnvironment.StoreClient;
  if (pending === 'fonts') fonts(false);
  if (pending === 'data') jest.mocked(useLocalDataReady).mockReturnValue(false);
  if (pending === 'session') jest.mocked(useSession).mockReturnValue({ loading: true, session: null } as ReturnType<typeof useSession>);
  path('/welcome'); renderRoot(); layout();
  expect(splash().length).toBeGreaterThan(0);
  expect(StyleSheet.flatten(splash()[0].props.style).backgroundColor).toBe('#FCF1DC');
  const image = tree.root.findByType(Image);
  expect(image.props.source).toEqual(require('../../../../assets/images/splash-beaver.png'));
  expect(image.props.resizeMode).toBe('contain');
  act(() => splash()[0].props.onLayout());
  fonts(true); jest.mocked(useLocalDataReady).mockReturnValue(true);
  jest.mocked(useSession).mockReturnValue({ loading: false, session: null } as ReturnType<typeof useSession>);
  updateRoot(); expect(splash()).toHaveLength(0); expect(jest.getTimerCount()).toBe(0);
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
  if (session && !loading) useDraft.getState().complete();
  jest.mocked(useSession).mockReturnValue({ loading, session } as ReturnType<typeof useSession>);
  act(() => { tree = create(<Startup />); });
  if (destination) expect(tree.root.findByType(Redirect).props.href).toBe(destination);
  else expect(tree.toJSON()).toBeNull();
});

test('startup resumes saved onboarding progress', () => {
  useDraft.getState().setStep('/classes');
  jest.mocked(useSession).mockReturnValue({ loading: false, session: null } as ReturnType<typeof useSession>);
  act(() => { tree = create(<Startup />); });
  expect(tree.root.findByType(Redirect).props.href).toBe('/classes');
});
