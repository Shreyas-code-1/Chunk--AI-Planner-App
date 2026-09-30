import { useEffect, useState } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Splash timing. Provisional — tune on a real device.
export const SPLASH_MIN_MS = 1500;
export const SPLASH_MAX_MS = 3000;
export const SPLASH_FADE_MS = 300;

// Must match the expo-splash-screen entry in app.json so the hand-off from the
// native splash is invisible.
// The logo tile's own cream, so its edge can't show.
const BACKGROUND = '#FBF1DB';
// 126 pt = 378 px at 3x: the widest the 380 px source stays sharp. Raise with a bigger export.
const IMAGE_WIDTH = 126;
const IMAGE_ASPECT = 380 / 346;

/**
 * In-app copy of the native splash. It takes over from the native splash on
 * its first layout (and is the only splash in Expo Go, which ignores app.json),
 * stays for at least SPLASH_MIN_MS and until `ready`, never past SPLASH_MAX_MS,
 * then fades into the first screen.
 */
export function StartupSplash({ ready, startedAt }: { ready: boolean; startedAt: number }) {
  const [opacity] = useState(() => new Animated.Value(1));
  const [minElapsed, setMinElapsed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const elapsed = Date.now() - startedAt;
    const min = setTimeout(() => setMinElapsed(true), Math.max(0, SPLASH_MIN_MS - elapsed));
    const max = setTimeout(() => setTimedOut(true), Math.max(0, SPLASH_MAX_MS - elapsed));
    return () => { clearTimeout(min); clearTimeout(max); };
  }, [startedAt]);

  const fading = (ready && minElapsed) || timedOut;
  useEffect(() => {
    if (!fading) return;
    Animated.timing(opacity, { toValue: 0, duration: SPLASH_FADE_MS, useNativeDriver: true })
      .start(() => setDone(true));
  }, [fading, opacity]);

  if (done) return null;
  return (
    <Animated.View
      testID="startup-splash"
      pointerEvents={fading ? 'none' : 'auto'}
      style={[styles.screen, { opacity }]}
      onLayout={() => { void SplashScreen.hideAsync(); }}
    >
      <Image
        accessibilityLabel="Chunk"
        source={require('../../../assets/images/splash-logo.png')}
        resizeMode="contain"
        style={styles.artwork}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFill, backgroundColor: BACKGROUND, alignItems: 'center', justifyContent: 'center' },
  artwork: { width: IMAGE_WIDTH, aspectRatio: IMAGE_ASPECT },
});
