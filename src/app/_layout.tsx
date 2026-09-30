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
import { Stack, usePathname } from 'expo-router';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { SessionProvider } from '../features/auth/SessionProvider';
import { queryClient } from '../lib/queryClient';
import { ExpoGoStartupPreview } from '../features/startup/ExpoGoStartupPreview';

// Keep the native splash until fonts and the destination route are ready.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const pathname = usePathname();
  const [laidOut, setLaidOut] = useState(false);
  const [revealed, setRevealed] = useState(false);

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

  const fontsReady = fontsLoaded || !!fontError;
  useEffect(() => {
    // Effects run after the destination has committed. Index is only a routing
    // gate; never reveal it. Direct links can render without awaiting auth.
    if (!fontsReady || !laidOut || pathname === '/' || revealed) return;
    void SplashScreen.hideAsync();
    setRevealed(true);
  }, [fontsReady, laidOut, pathname, revealed]);

  return (
    // GestureHandlerRootView must wrap everything that uses a gesture, and
    // the Slider does.
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#FFFFFF' }} onLayout={() => setLaidOut(true)}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            {fontsReady && <Stack
              screenOptions={{
                headerShown: false,
                // No animated intermediate screen on initial routing.
                animation: revealed ? 'fade' : 'none',
                contentStyle: { backgroundColor: '#FFFFFF' },
                animationDuration: 180,
              }}
            />}
            {Constants.executionEnvironment === ExecutionEnvironment.StoreClient && (
              <ExpoGoStartupPreview fontsReady={fontsReady} pathname={pathname} />
            )}
          </SessionProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
