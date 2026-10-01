/**
 * AI consent, between 2.2 WELCOME and 2.3 GOALS (brief §12, §13a).
 *
 * TODO(design): not on the board. Built from existing components and styles
 * at Shreyas's request (29 Sep); copy to be reviewed before launch.
 *
 * Either answer continues onboarding. Declining keeps AI features off
 * until AI is switched on from Profile.
 */

import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '../../components/ui/AppImage';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ScreenScroll } from '../../components/ui';
import { mascot } from '../../components/mascot';
import { PRIVACY_POLICY_URL, useAiConsent } from '../../features/ai/consent';
import { colors, displayLine, fonts } from '../../theme/tokens';

const LINES = [
  'When Chunk uses AI, it sends your work to Anthropic, an AI company.',
  "Anthropic doesn't use it to train its AI by default.",
  'You can always type everything yourself instead.',
];

export default function AiConsent() {
  const router = useRouter();
  const choose = useAiConsent((s) => s.choose);

  const decide = (granted: boolean) => {
    choose(granted);
    router.push('/goals');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScreenScroll>
        <StatusBar style="dark" />

        <View style={styles.content}>
          <Text style={styles.headline}>One thing before we start</Text>
          <AppImage source={mascot.name} style={styles.mascot} resizeMode="contain" />
          <View style={styles.lines}>
            {LINES.map((line) => (
              <Text key={line} style={styles.line}>
                {line}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Button label="SOUNDS GOOD" onPress={() => decide(true)} />
          <Pressable
            accessibilityRole="button"
            onPress={() => decide(false)}
            style={styles.textButton}
          >
            <Text style={styles.textButtonLabel}>{"I'll type everything"}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(PRIVACY_POLICY_URL).catch(() => console.warn('[links] privacy-open-failed'))}
          >
            <Text style={styles.link}>Privacy policy</Text>
          </Pressable>
        </View>
      </ScreenScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 20,
  },
  headline: {
    fontFamily: fonts.display.extraBold,
    fontSize: 30,
    lineHeight: displayLine(30, 1.15),
    color: colors.ink,
    textAlign: 'center',
  },
  mascot: { width: 150, height: 150 },
  lines: { gap: 12 },
  line: {
    fontFamily: fonts.body.bold,
    fontSize: 15,
    lineHeight: 15 * 1.45,
    color: colors.muted,
    textAlign: 'center',
  },
  footer: { paddingHorizontal: 26, paddingBottom: 24, paddingTop: 12, gap: 6 },
  textButton: { paddingVertical: 12, alignItems: 'center' },
  textButtonLabel: { fontFamily: fonts.body.black, fontSize: 14.5, color: colors.orangeDeep },
  link: {
    textAlign: 'center',
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
});
