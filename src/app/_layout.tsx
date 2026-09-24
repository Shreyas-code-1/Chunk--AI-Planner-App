/**
 * Root layout: providers, fonts and the error boundary.
 *
 * No screen chrome is set here yet — headers, backgrounds and transitions come
 * from the board, and the board's values are not in the code until the design
 * foundation (0c) is built.
 */

import {
  Baloo2_400Regular,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/baloo-2';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { SessionProvider } from '../features/auth/SessionProvider';
import { initializeRevenueCat } from '../features/billing/initialize';
import { RevenueCatIdentitySync } from '../features/billing/RevenueCatIdentitySync';
import { queryClient } from '../lib/queryClient';

// Screen 2.1 is a real splash with its own minimum duration; the native splash
// stays up until the fonts are ready so nothing renders in a fallback face.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    void initializeRevenueCat().catch(() => {
      console.error('RevenueCat initialization failed. Check the local billing configuration.');
    });
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    Baloo2_400Regular,
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    // The board's heaviest labels are 900, which only Nunito has.
    Nunito_900Black,
  });

  useEffect(() => {
    // A font that fails to load is not a reason to hold the app hostage; the
    // system face is wrong but usable, and the failure is visible.
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    // GestureHandlerRootView must wrap everything that uses a gesture, and
    // the Slider does.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <RevenueCatIdentitySync />
            <Stack
              screenOptions={{
                headerShown: false,
                // The groups set their own; this covers the splash handing
                // over to whichever group comes next.
                animation: 'fade',
                animationDuration: 180,
              }}
            />
          </SessionProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
