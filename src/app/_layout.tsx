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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { useLocalDataReady, useOnboardingProgress } from '../features/persistence/localData';
import { useAndroidBack } from '../features/navigation/useAndroidBack';
import { preloadImages } from '../lib/preloadImages';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AiConsentSync } from '../features/ai/AiConsentSync';
import { SessionProvider, useSession } from '../features/auth/SessionProvider';
import { queryClient } from '../lib/queryClient';
import { ExpoGoStartupPreview } from '../features/startup/ExpoGoStartupPreview';

// Keep the native splash until required local startup work and routing settle.
void SplashScreen.preventAutoHideAsync().catch(() => console.warn('[startup] splash-prepare-failed'));


export default function RootLayout() {
  return <SessionProvider><StartupContent /></SessionProvider>;
}

function StartupContent() {
  const { loading } = useSession();
  const dataReady = useLocalDataReady();
  const pathname = usePathname();
  useAndroidBack(pathname);
  useOnboardingProgress(pathname, dataReady && !loading);
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

  useEffect(() => {
    // Warm bundled images in the background; startup never waits for prefetch/network.
    void preloadImages().catch(() => console.warn('[startup] image-preload-failed'));
  }, []);
  const fontsReady = fontsLoaded || !!fontError;
  // Index is only a routing gate, so leaving it means session and route are
  // settled. Direct links skip it.
  const storesReady = dataReady && fontsReady && !loading;
  const ready = storesReady && laidOut && pathname !== '/';
  useEffect(() => {
    if (!ready || revealed) return;
    void SplashScreen.hideAsync().catch(() => console.warn('[startup] splash-hide-failed'));
    setRevealed(true);
  }, [ready, revealed]);

  return (
    // GestureHandlerRootView must wrap everything that uses a gesture, and
    // the Slider does.
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#FCF1DC' }} onLayout={() => setLaidOut(true)}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>

            {dataReady && <AiConsentSync />}
            {storesReady && <Stack
              screenOptions={{
                headerShown: false,
                // No animated intermediate screen on initial routing.
                animation: revealed ? 'fade' : 'none',
                contentStyle: { backgroundColor: '#FFFFFF' },
                animationDuration: 180,
              }}
            />}
            {Constants.executionEnvironment === ExecutionEnvironment.StoreClient && (
              <ExpoGoStartupPreview ready={ready} />
            )}

        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
