/**
 * 2.2 WELCOME.
 *
 * The first screen with a decision on it. Two buttons: GET STARTED begins
 * onboarding, and "I ALREADY HAVE AN ACCOUNT" goes to sign-in.
 *
 * Sign-in is batch 3, so that second button is drawn exactly as the board
 * draws it and is inert — it has no `onPress` rather than a handler that
 * pretends. This is the App Completeness gap recorded in docs/decision-log.md
 * and it closes in batch 3, well before submission.
 */

import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui';
import { HighlightChip } from '../../components/ui/StrokedText';
import { mascot } from '../../components/mascot';
import { colors, fonts } from '../../theme/tokens';

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Image source={mascot.waving} style={styles.mascot} resizeMode="contain" />

        <View style={styles.copy}>
          {/* The board breaks this line itself: "Let's [chunk]" then
              "today's work." The chip is a real box with placeholder text. */}
          <View style={styles.headlineRow}>
            <Text style={styles.headline}>{"Let's "}</Text>
            <HighlightChip fontSize={40}>chunk</HighlightChip>
          </View>
          <Text style={styles.headline}>{"today's work."}</Text>

          <Text style={styles.sub}>
            {"Big assignments, cut into pieces you'll actually finish."}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="GET STARTED" onPress={() => router.push('/goals')} />
        <Button label="I ALREADY HAVE AN ACCOUNT" variant="secondary" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    // 2.2 is the one onboarding screen on pure white rather than the cream.
    backgroundColor: colors.card,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 26,
  },
  mascot: {
    height: 236,
    width: 236,
  },
  copy: {
    alignItems: 'center',
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontFamily: fonts.display.extraBold,
    fontSize: 40,
    lineHeight: 40 * 1.16,
    color: colors.ink,
    textAlign: 'center',
  },
  sub: {
    fontFamily: fonts.body.bold,
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 14,
  },
  footer: {
    paddingHorizontal: 26,
    paddingBottom: 40,
    paddingTop: 12,
    gap: 12,
  },
});
