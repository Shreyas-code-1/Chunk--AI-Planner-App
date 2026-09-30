import { Image, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useSession } from '../auth/SessionProvider';

/** Mounted only in Expo Go; no duration or additional startup work. */
export function ExpoGoStartupPreview({ fontsReady, pathname }: { fontsReady: boolean; pathname: string }) {
  const { loading } = useSession();
  // Direct links do not require session restoration to render their destination.
  const pending = !fontsReady || (pathname === '/' && loading);
  if (!pending) return null;

  return (
    <View testID="expo-go-startup-preview" style={styles.screen} onLayout={() => { void SplashScreen.hideAsync(); }}>
      <Image
        accessibilityLabel="Chunk beaver splash"
        source={require('../../../assets/images/splash-beaver.png')}
        resizeMode="contain"
        style={styles.artwork}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#FCF1DC', alignItems: 'center', justifyContent: 'center' },
  artwork: { width: 240, maxWidth: '100%', height: 240, maxHeight: '100%' },
});
