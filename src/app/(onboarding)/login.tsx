/**
 * 2.17 LOG IN.
 *
 * Reached two ways: forward from the paywall, and back from 2.2's "I already
 * have an account", which was inert until this screen existed.
 *
 * Apple and Google are native modules that cannot run in Expo Go, so
 * SessionProvider's stubs throw a message saying exactly that rather than
 * failing silently — see the decision log. Email works today.
 *
 * "Continue with email" leads to 2.18, which is a frame now. It collects the
 * address only — nothing is sent and nothing is verified yet.
 *
 * TODO: the Terms and Privacy Policy line is not yet a link — neither document
 * exists, and both are required before submission.
 */

import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppleMark, ChevronLeft, GoogleMark, Mail } from '../../components/icons';
import { mascot } from '../../components/mascot';
import { useSession } from '../../features/auth/SessionProvider';
import { haptic } from '../../lib/haptics';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

export default function Login() {
  const router = useRouter();
  const { signInWithApple, signInWithGoogle } = useSession();
  const [problem, setProblem] = useState<string | null>(null);

  const attempt = async (run: () => Promise<void>) => {
    haptic('press');
    try {
      setProblem(null);
      await run();
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'That did not work.');
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => {
            haptic('select');
            router.back();
          }}
          style={styles.back}
        >
          <ChevronLeft size={18} color={colors.ink} strokeWidth={2.8} />
        </Pressable>
      </View>

      <View style={styles.middle}>
        <Image source={mascot.login} style={styles.mascot} resizeMode="contain" />
        <View style={styles.copy}>
          <Text style={styles.headline}>{'Create an\naccount.'}</Text>
          <Text style={styles.sub}>
            So your chunks, streaks and classes save across devices.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {problem ? (
          // TODO(design): no error treatment exists on the board for this.
          <Text style={styles.problem}>{problem}</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => attempt(signInWithGoogle)}
          style={[styles.provider, styles.providerPlain, shadows.hardEdge(5)]}
        >
          <GoogleMark />
          <Text style={styles.providerLabel}>CONTINUE WITH GOOGLE</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => attempt(signInWithApple)}
          style={[styles.provider, styles.providerDark, shadows.hardEdge(5)]}
        >
          <AppleMark />
          <Text style={[styles.providerLabel, styles.onDark]}>CONTINUE WITH APPLE</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            haptic('select');
            router.push('/email');
          }}
          style={[styles.provider, styles.providerEmail, shadows.hardEdge(5)]}
        >
          <Mail size={22} color={colors.white} strokeWidth={2.4} />
          <Text style={[styles.providerLabel, styles.onDark]}>CONTINUE WITH EMAIL</Text>
        </Pressable>

        <Text style={styles.legal}>By continuing you agree to our Terms and Privacy Policy.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.card },
  headerRow: { paddingTop: 6, paddingHorizontal: 26 },
  back: {
    width: 42,
    height: 42,
    borderRadius: radii.mdAlt,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 22,
  },
  mascot: { height: 214, width: 214 },
  copy: { alignItems: 'center' },
  headline: {
    fontFamily: fonts.display.extraBold,
    fontSize: 38,
    lineHeight: displayLine(38, 1.16),
    color: colors.ink,
    textAlign: 'center',
  },
  sub: {
    marginTop: 12,
    fontFamily: fonts.body.bold,
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
  },
  actions: { paddingHorizontal: 26, paddingBottom: 22, gap: 12 },
  provider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: radii.xl,
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  providerPlain: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
  },
  providerDark: { backgroundColor: colors.ink },
  providerEmail: { backgroundColor: colors.orange },
  providerLabel: {
    flex: 1,
    fontFamily: fonts.body.black,
    fontSize: 14.5,
    letterSpacing: 14.5 * 0.04,
    color: colors.ink,
  },
  onDark: { color: colors.white },
  legal: {
    marginTop: 4,
    textAlign: 'center',
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    lineHeight: 12.5 * 1.5,
    color: colors.mutedLight,
  },
  problem: {
    fontFamily: fonts.body.bold,
    fontSize: 13,
    lineHeight: 13 * 1.45,
    color: colors.orangeDeep,
  },
});
