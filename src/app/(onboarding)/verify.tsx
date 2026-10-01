/**
 * 2.19 LOG IN — VERIFY.
 *
 * TODO(design): **this frame is not in `design/board.html`.** Like 2.18, it
 * arrived as a screenshot (`CHUNK Board verify.png`), so the values here come
 * from the token the same element uses elsewhere wherever one exists. The
 * exceptions are listed in the decision log.
 *
 * Verifies the requested email code through the auth layer before navigation.
 *
 * The six boxes are drawn, but the typing happens in one hidden field behind
 * them. Six real inputs means six focus handlers and a backspace problem; one
 * field means the digits are a string and the boxes are a rendering of it.
 */

import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppImage } from '../../components/ui/AppImage';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui';
import { ChevronLeft } from '../../components/icons';
import { mascot } from '../../components/mascot';
import { verifyEmailOtp } from '../../features/auth/verifyEmailOtp';
import { haptic } from '../../lib/haptics';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

const CODE_LENGTH = 6;
const EMAIL_PROBLEM = 'Go back and enter a valid email address to verify your code.';

export default function Verify() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string | string[] }>();
  const address = typeof email === 'string' ? email.trim() : '';
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address);
  const field = useRef<TextInput>(null);

  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const locked = useRef(false);
  const active = useRef(false);
  const generation = useRef(0);
  useFocusEffect(useCallback(() => {
    active.current = true;
    return () => { active.current = false; generation.current += 1; };
  }, [address]));

  const onVerify = async () => {
    if (locked.current || !active.current) return;
    setProblem(null);
    if (!validEmail) { setProblem(EMAIL_PROBLEM); return; }
    if (!/^[0-9]{6}$/.test(code)) {
      setProblem('Enter all six digits.');
      field.current?.focus();
      return;
    }
    locked.current = true;
    setVerifying(true);
    const current = generation.current;
    try {
      const result = await verifyEmailOtp(address, code);
      if (!active.current || current !== generation.current) return;
      if (result.status === 'verified') {
        active.current = false;
        router.replace('/home');
      } else if (result.status === 'invalid-or-expired') {
        setProblem('That code is invalid or has expired. Please check it and try again.');
      } else if (result.status === 'invalid-input') {
        setProblem(result.field === 'email' ? EMAIL_PROBLEM : 'Enter all six digits.');
      } else {
        setProblem('We couldn’t verify your code. Please try again.');
      }
    } catch {
      if (active.current && current === generation.current) {
        setProblem('We couldn’t verify your code. Please try again.');
      }
    } finally {
      locked.current = false;
      setVerifying(false);
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
          <AppImage source={mascot.verify} style={styles.mascot} resizeMode="contain" />
          <Text style={styles.headline}>Check your email.</Text>
        </View>

        <Text style={styles.sentTo}>
          {validEmail ? <>Enter the code sent to <Text style={styles.address}>{address}</Text></> : 'Return to the email screen to request a code.'}
        </Text>

        <Pressable
          accessibilityRole="none"
          onPress={() => field.current?.focus()}
          style={styles.boxes}
        >
          {Array.from({ length: CODE_LENGTH }, (_, index) => {
            const digit = code[index];
            const active = focused && index === code.length;
            return (
              <View
                key={index}
                style={[
                  styles.box,
                  digit ? styles.boxFilled : styles.boxEmpty,
                  active && styles.boxActive,
                  active && shadows.hardEdge(5, colors.edgeOrangeSoft),
                ]}
              >
                {digit ? (
                  <Text style={styles.digit}>{digit}</Text>
                ) : active ? (
                  <View style={styles.caret} />
                ) : null}
              </View>
            );
          })}
        </Pressable>

        {/*
          The real field. Transparent and behind the boxes rather than hidden,
          because a zero-sized or `display: none` input cannot take focus on
          Android and the keyboard never opens.
        */}
        <TextInput
          ref={field}
          accessibilityLabel="Six-digit code"
          value={code}
          editable={!verifying}
          onSubmitEditing={onVerify}
          onChangeText={(text) => {
            setCode(text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH));
            setProblem(null);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={CODE_LENGTH}
          caretHidden
          style={styles.hiddenField}
        />

        <Text style={styles.helper}>Enter your latest six-digit code.</Text>

        {(!validEmail || problem) ? (
          // TODO(design): the board draws no error state for these boxes.
          <Text style={styles.problem}>{!validEmail ? EMAIL_PROBLEM : problem}</Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button label={verifying ? 'VERIFYING…' : 'VERIFY'} disabled={verifying || !validEmail} onPress={onVerify} />

        <Pressable
          accessibilityRole="button"
          disabled={verifying}
          onPress={() => {
            haptic('select');
            setProblem('To request another code, go back to the email screen.');
          }}
          style={styles.resend}
        >
          <Text style={styles.resendLabel}>Resend code</Text>
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
  sentTo: {
    marginTop: 22,
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 14 * 1.4,
    color: colors.muted,
  },
  address: { fontFamily: fonts.body.extraBold, color: colors.ink },
  boxes: { marginTop: 14, flexDirection: 'row', gap: 10 },
  box: {
    flex: 1,
    height: 57,
    borderRadius: radii.lg + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxEmpty: { backgroundColor: colors.barTrack },
  boxFilled: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.cream },
  boxActive: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.orange },
  digit: {
    fontFamily: fonts.display.extraBold,
    fontSize: 28,
    lineHeight: displayLine(28, 1),
    color: colors.ink,
    includeFontPadding: false,
  },
  caret: { width: 3, height: 26, borderRadius: 2, backgroundColor: colors.orange },
  hiddenField: {
    position: 'absolute',
    opacity: 0,
    // Behind the boxes, matching their band, so a tap anywhere lands on it.
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  helper: {
    marginTop: 14,
    fontFamily: fonts.body.bold,
    fontSize: 14,
    color: colors.mutedLight,
  },
  problem: {
    marginTop: 10,
    fontFamily: fonts.body.bold,
    fontSize: 13,
    lineHeight: 13 * 1.45,
    color: colors.orangeDeep,
  },
  footer: { paddingHorizontal: 26, paddingBottom: 26, paddingTop: 8 },
  resend: { marginTop: 16, alignItems: 'center' },
  resendLabel: {
    fontFamily: fonts.body.extraBold,
    fontSize: 14,
    color: colors.muted,
  },
});
