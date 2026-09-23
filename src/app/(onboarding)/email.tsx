/**
 * 2.18 LOG IN — EMAIL.
 *
 * Reached from 2.17's CONTINUE WITH EMAIL, which reported a missing screen
 * until this one existed.
 *
 * TODO(design): **this frame is not in `design/board.html`.** The 19 Sep export
 * ends at 2.17; 2.18 arrived as a screenshot, so every value here is taken from
 * the token that the analogous element uses elsewhere rather than extracted
 * from the board. Promote the next export and reconcile — see the decision log.
 *
 * Requests an email OTP before opening verification. Verification is still
 * a prototype and is not connected to Supabase yet.
 */

import { useCallback, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Input } from '../../components/ui';
import { ChevronLeft } from '../../components/icons';
import { mascot } from '../../components/mascot';
import { requestEmailOtp } from '../../features/auth/requestEmailOtp';
import { haptic } from '../../lib/haptics';
import { isOnline } from '../../lib/network';
import { colors, displayLine, fonts, radii } from '../../theme/tokens';

/**
 * Deliberately loose. The only authority on whether an address exists is the
 * verification step, so this catches a typo, not a fake.
 */
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailSignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const locked = useRef(false);
  const generation = useRef(0);
  const focused = useRef(false);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    return () => { focused.current = false; generation.current += 1; };
  }, []));

  const onContinue = async () => {
    if (locked.current || !focused.current) return;
    setProblem(null);
    const address = email.trim();
    if (!LOOKS_LIKE_EMAIL.test(address)) {
      setProblem('That does not look like an email address.');
      return;
    }
    locked.current = true;
    setSending(true);
    const current = generation.current;
    try {
      const online = await isOnline();
      if (!focused.current || current !== generation.current) return;
      if (!online) {
        router.push('/offline');
        return;
      }
      const result = await requestEmailOtp(address);
      if (!focused.current || current !== generation.current) return;
      if (result.status === 'requested') {
        router.push({ pathname: '/verify', params: { email: address } });
      } else {
        setProblem(result.reason === 'invalid-email'
          ? 'That does not look like an email address.'
          : 'We couldn’t send your code. Please try again.');
      }
    } catch {
      if (focused.current && current === generation.current) {
        setProblem('We couldn’t send your code. Please try again.');
      }
    } finally {
      locked.current = false;
      setSending(false);
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

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heading}>
          <Image source={mascot.email} style={styles.mascot} resizeMode="contain" />
          <Text style={styles.headline}>{"What's your email?"}</Text>
        </View>

        <Input
          label="EMAIL ADDRESS"
          size="large"
          style={styles.field}
          value={email}
          editable={!sending}
          onChangeText={(text) => {
            setEmail(text);
            setProblem(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="done"
          onSubmitEditing={onContinue}
        />

        <Text style={styles.helper}>{"We'll send a six-digit code. No password to remember."}</Text>

        {problem ? (
          // TODO(design): no error treatment exists on the board for a field.
          // Plain, and the same shape 2.17 uses, rather than an invented one.
          <Text style={styles.problem}>{problem}</Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button label={sending ? 'SENDING…' : 'CONTINUE'} disabled={sending} onPress={onContinue} />

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            haptic('select');
            router.back();
          }}
          style={styles.alternative}
        >
          <Text style={styles.alternativeLabel}>Use a different way to sign in</Text>
        </Pressable>
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
  body: { paddingHorizontal: 26, paddingTop: 18, paddingBottom: 24 },
  // The mascot sits beside the headline here rather than above it, which is
  // why this is a row and 2.17's equivalent is not.
  heading: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  mascot: { width: 124, height: 128 },
  headline: {
    flex: 1,
    fontFamily: fonts.display.extraBold,
    fontSize: 34,
    lineHeight: displayLine(34, 1.15),
    color: colors.ink,
    includeFontPadding: false,
  },
  field: { marginTop: 26 },
  helper: {
    marginTop: 12,
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 14 * 1.45,
    color: colors.muted,
  },
  problem: {
    marginTop: 12,
    fontFamily: fonts.body.bold,
    fontSize: 13,
    lineHeight: 13 * 1.45,
    color: colors.orangeDeep,
  },
  footer: { paddingHorizontal: 26, paddingBottom: 26, paddingTop: 8 },
  alternative: { marginTop: 16, alignItems: 'center' },
  alternativeLabel: {
    fontFamily: fonts.body.extraBold,
    fontSize: 14,
    color: colors.muted,
  },
});
