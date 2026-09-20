/**
 * 3.4 CHUNK COMPLETE.
 *
 * Reached from 3.3 when a chunk is finished, so the minutes and the position
 * in the day come through as parameters and are the real ones.
 *
 * Two things the board draws are deliberately absent. The encouraging line
 * ("That was the dense part of the chapter. Two easy ones left.") is written
 * about the specific chunk, which means it is model output, and §6 puts every
 * model call behind an Edge Function that does not exist — so the line is a
 * fixed one rather than a fabricated read of work nobody looked at. The
 * flashcards offer ("Want these notes as 18 flashcards?") names a count that
 * only 4.x can produce, and 4.3-4.5 are not built.
 *
 * TODO(batch 7): both of those return with the AI features.
 * TODO: nothing is written to `chunk_completions` yet, so the streak and the
 * lifetime count stay at zero rather than incrementing a number we are not
 * storing.
 */

import { Image, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/ui';
import { mascot } from '../../components/mascot';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

export default function ChunkComplete() {
  const router = useRouter();
  const params = useLocalSearchParams<{ minutes?: string; index?: string; total?: string }>();

  const minutes = Number(params.minutes ?? 0);
  const index = Number(params.index ?? 0);
  const total = Number(params.total ?? 0);

  // TODO(batch 5): both come from `chunk_completions`, which is not written.
  const streak = 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.body}>
        <View style={styles.middle}>
          <Image source={mascot.complete} style={styles.mascot} resizeMode="contain" />

          <View style={styles.copy}>
            <Text style={styles.headline}>
              {index > 0 ? `Chunk ${index} done!` : 'Chunk done!'}
            </Text>
            <Text style={styles.sub}>That one is behind you. Take the win.</Text>
          </View>

          <View style={[styles.card, shadows.hardEdge(6)]}>
            <View style={styles.statRow}>
              <Stat value={`${minutes}`} label="MIN FOCUSED" />
              <View style={styles.divider} />
              <Stat value={total > 0 ? `${index}/${total}` : '0/0'} label="TODAY" />
              <View style={styles.divider} />
              <Stat value={`${streak}`} label="DAY STREAK" accent />
            </View>

            <View style={styles.segments}>
              {Array.from({ length: Math.max(total, 5) }, (_, position) => (
                <View
                  key={position}
                  style={[
                    styles.segment,
                    position < index ? styles.segmentDone : styles.segmentTodo,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            label="TAKE A 10-MIN BREAK"
            onPress={() => router.replace('/home')}
          />
          <Button
            label={total > 0 && index < total ? `STRAIGHT INTO CHUNK ${index + 1}` : 'BACK TO TODAY'}
            variant="secondary"
            onPress={() => router.replace('/today')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: { flex: 1, paddingHorizontal: 26, paddingTop: 20, paddingBottom: 32 },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 },
  mascot: { height: 200, width: 200 },
  copy: { alignItems: 'center' },
  headline: {
    fontFamily: fonts.display.extraBold,
    fontSize: 42,
    lineHeight: displayLine(42, 1.1),
    color: colors.ink,
    textAlign: 'center',
    includeFontPadding: false,
  },
  sub: {
    marginTop: 10,
    maxWidth: 280,
    fontFamily: fonts.body.bold,
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
  },

  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: radii.chip - 2,
    padding: 20,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: {
    fontFamily: fonts.display.extraBold,
    fontSize: 28,
    lineHeight: displayLine(28, 1),
    color: colors.ink,
    includeFontPadding: false,
  },
  statValueAccent: { color: colors.orange },
  statLabel: {
    marginTop: 3,
    fontFamily: fonts.body.extraBold,
    fontSize: 11,
    color: colors.muted,
  },
  divider: { width: 2, backgroundColor: colors.track },

  segments: { marginTop: 16, flexDirection: 'row', gap: 5 },
  segment: { flex: 1, height: 9, borderRadius: 5 },
  segmentDone: { backgroundColor: colors.success },
  segmentTodo: { backgroundColor: colors.track },

  actions: { gap: 12 },
});
