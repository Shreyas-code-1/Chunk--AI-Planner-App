import { StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { AppImage } from '../../components/ui/AppImage';
import { colors } from '../../theme/tokens';

/**
 * Expo Go only: Expo Go shows its own splash, not ours, so this draws ours
 * until startup is ready. No timer — it lasts exactly as long as startup.
 *
 * The look is the 30 Sep decision (decision log): button orange with the
 * outlined logo at 197pt — not the cream/beaver variant from the persistence
 * branch, which would have reverted it.
 */
export function ExpoGoStartupPreview({ ready }: { ready: boolean }) {
  if (ready) return null;
  return (
    <View
      testID="expo-go-startup-preview"
      style={styles.screen}
      onLayout={() => {
        void SplashScreen.hideAsync().catch(() => console.warn('[startup] splash-hide-failed'));
      }}
    >
      <AppImage
        accessibilityLabel="Chunk"
        source={require('../../../assets/images/splash-logo.png')}
        resizeMode="contain"
        style={styles.artwork}
      />
    </View>
  );
}

const IMAGE_WIDTH = 197;
const IMAGE_ASPECT = 1308 / 1089;

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artwork: { width: IMAGE_WIDTH, height: IMAGE_WIDTH / IMAGE_ASPECT },
});
