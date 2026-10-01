import { Image, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

/** Expo Go only. No timer: the preview lasts exactly as long as startup needs. */
export function ExpoGoStartupPreview({ ready }: { ready: boolean }) {
  if (ready) return null;
  return (
    <View testID="expo-go-startup-preview" style={styles.screen} onLayout={() => { void SplashScreen.hideAsync().catch(() => console.warn('[startup] splash-hide-failed')); }}>
      <Image accessibilityLabel="Chunk beaver splash"
        source={require('../../../assets/images/splash-beaver.png')}
        resizeMode="contain" style={styles.artwork} />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFill, backgroundColor: '#FCF1DC', alignItems: 'center', justifyContent: 'center' },
  artwork: { width: 240, height: 240, maxWidth: '100%', maxHeight: '100%' },
});
