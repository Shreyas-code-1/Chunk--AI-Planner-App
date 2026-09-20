/**
 * 2.1 SPLASH.
 *
 * The orange gradient screen that holds while the stored session is read. It
 * is a real screen, not the native splash: the native one is dismissed in the
 * root layout as soon as the fonts are ready, and this takes over so the
 * hand-off happens between two orange surfaces rather than through a flash of
 * white.
 *
 * The logo is a stroked-text placeholder and renders nothing until artwork
 * lands — see docs/stroked-elements.md, element 1.
 */

import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { OrangeGradient } from '../components/ui';
import { StrokedText } from '../components/ui/StrokedText';
import { mascot } from '../components/mascot';
import { useSession } from '../features/auth/SessionProvider';
import { colors } from '../theme/tokens';

/**
 * How long the splash is held even when there is nothing to wait for.
 *
 * A session read off the Keychain usually finishes in a few milliseconds, and
 * without a floor the screen would appear and vanish as a flicker. Provisional
 * — it is a feel value, to be judged on a device rather than argued about.
 */
const MIN_VISIBLE_MS = 1200;

export default function Splash() {
  const router = useRouter();
  const { loading } = useSession();
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeld(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!held || loading) return;
    // TODO(batch 4): a signed-in user belongs on 3.1 HOME, which does not
    // exist yet. Until it does, everyone lands on 2.2 — deliberately, rather
    // than routing to a screen that would crash.
    router.replace('/welcome');
  }, [held, loading, router]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <OrangeGradient />

      <View style={styles.logo}>
        {/* Baloo 2 800, 104px, letter-spacing -.03em, line-height .95. */}
        <StrokedText
          fontSize={104}
          letterSpacing={-0.03 * 104}
          lineHeight={104 * 0.95}
          style={{ color: colors.onOrange }}
        >
          chunk
        </StrokedText>
      </View>

      <View style={styles.art}>
        <Image source={mascot.splash} style={styles.mascot} resizeMode="contain" />
      </View>

      <View style={styles.indicatorRow}>
        <View style={styles.indicator} />
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    // Shows for the frame before the SVG paints, and behind it on any device
    // where the gradient fails to render at all.
    backgroundColor: colors.orange,
  },
  logo: {
    paddingTop: 58,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  art: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  mascot: {
    width: '100%',
    maxWidth: 312,
    height: '100%',
  },
  indicatorRow: {
    paddingHorizontal: 40,
    paddingBottom: 58,
    alignItems: 'center',
  },
  indicator: {
    width: 56,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
});
