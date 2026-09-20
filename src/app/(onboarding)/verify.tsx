/**
 * 2.19 LOG IN — VERIFY.
 *
 * TODO(design): **this frame is not in `design/board.html`.** Like 2.18, it
 * arrived as a screenshot (`CHUNK Board verify.png`), so the values here come
 * from the token the same element uses elsewhere wherever one exists. The
 * exceptions are listed in the decision log.
 *
 * TODO: **no code is sent and no code is checked.** Any six digits are
 * accepted, by request, so the flow reaches 3.1. `supabase.auth.verifyOtp`
 * replaces `onVerify`'s body when the send side exists on 2.18.
 *
 * The six boxes are drawn, but the typing happens in one hidden field behind
 * them. Six real inputs means six focus handlers and a backspace problem; one
 * field means the digits are a string and the boxes are a rendering of it.
 */

import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui';
import { ChevronLeft } from '../../components/icons';
import { mascot } from '../../components/mascot';
import { haptic } from '../../lib/haptics';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

const CODE_LENGTH = 6;
/** The board's own wording. Not enforced, because no code is issued yet. */
const EXPIRY_MINUTES = 10;

export default function Verify() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const field = useRef<TextInput>(null);

  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const onVerify = () => {
    if (code.length < CODE_LENGTH) {
      setProblem('Enter all six digits.');
      field.current?.focus();
      return;
    }
    // TODO: verify the code. Any six digits pass until the send side exists.
    router.replace('/home');
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
          <Image source={mascot.verify} style={styles.mascot} resizeMode="contain" />
          <Text style={styles.headline}>Check your email.</Text>
        </View>

        <Text style={styles.sentTo}>
          Six-digit code sent to <Text style={styles.address}>{email ?? 'your inbox'}</Text>
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

        <Text style={styles.helper}>{`The code expires in ${EXPIRY_MINUTES} minutes.`}</Text>

        {problem ? (
          // TODO(design): the board draws no error state for these boxes.
          <Text style={styles.problem}>{problem}</Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button label="VERIFY" onPress={onVerify} />

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            haptic('select');
            // TODO: nothing is sent, so there is nothing to send again.
            setProblem('Sending codes is not wired up yet.');
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
