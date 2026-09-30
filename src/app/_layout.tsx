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
import { useState } from 'react';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { AiConsentSync } from '../features/ai/AiConsentSync';
import { SessionProvider } from '../features/auth/SessionProvider';
import { queryClient } from '../lib/queryClient';
import { StartupSplash } from '../features/startup/StartupSplash';

// Keep the native splash up until StartupSplash has drawn its copy over it.
void SplashScreen.preventAutoHideAsync();
const startedAt = Date.now();

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
  // Index is only a routing gate, so leaving it means session and route are
  // settled. Direct links skip it.
  const ready = fontsReady && laidOut && pathname !== '/';
  if (ready && !revealed) setRevealed(true);

  return (
    // GestureHandlerRootView must wrap everything that uses a gesture, and
    // the Slider does.
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#FFFFFF' }} onLayout={() => setLaidOut(true)}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <AiConsentSync />
            {fontsReady && <Stack
              screenOptions={{
                headerShown: false,
                // No animated intermediate screen on initial routing.
                animation: revealed ? 'fade' : 'none',
                contentStyle: { backgroundColor: '#FFFFFF' },
                animationDuration: 180,
              }}
            />}
            <StartupSplash ready={ready} startedAt={startedAt} />
          </SessionProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
