/**
 * 2.15 YOUR FIRST PLAN.
 *
 * The payoff screen: how much work went in, how many chunks came out, and
 * what today looks like.
 *
 * Every number here is real. The board's frame shows "10 hours became 21
 * chunks" over three example rows; §5 forbids faking these ("Do not fake
 * larger numbers"), so they are computed from the plan that actually exists.
 * Until 2.13's capture routes and the chunking pipeline land, that plan is
 * empty and the screen says so.
 *
 * TODO(design): **there is no empty state drawn for this screen.** The board
 * only draws it full. The note below is deliberately plain rather than an
 * invented treatment.
 *
 * TODO(design): **the subject chip colours here disagree with 2.5's.** This
 * frame draws Alg as #DEEBE8/#1F6F66 and Eng as #F1E4EC/#8A3A72, while 2.5
 * draws the palette currently in src/theme/tokens.ts. The chips below use the
 * tokens, so this screen will not match its own frame until that is settled.
 */

import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, SpeechBubble } from '../../components/ui';
import { HighlightChip } from '../../components/ui/StrokedText';
import { mascot } from '../../components/mascot';
import { BEST_TIMES, useDraft } from '../../features/onboarding/draft';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

/** A chunk as this screen needs it. Empty until the pipeline exists. */
type PlannedChunk = {
  id: string;
  className: string;
  title: string;
  source: string;
  minutes: number;
};

function formatClock(minutesFromMidnight: number): string {
  const hour24 = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export default function FirstPlan() {
  const router = useRouter();
  const bestTime = useDraft((s) => s.bestTime);

  // No chunks exist yet — see the note above. Typed and read like real data so
  // that supplying it later is a change of source, not of screen.
  const chunks: PlannedChunk[] = [];
  const totalMinutes = chunks.reduce((sum, chunk) => sum + chunk.minutes, 0);
  const hours = Math.round((totalMinutes / 60) * 10) / 10;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <SpeechBubble
          mascot={<Image source={mascot.firstPlan} style={styles.mascot} resizeMode="contain" />}
        >
          Your week is ready.
        </SpeechBubble>

        <View style={styles.headlineBlock}>
          <Text style={styles.headline}>{`${hours} hours became`}</Text>
          <HighlightChip fontSize={38}>
            {`${chunks.length} ${chunks.length === 1 ? 'chunk' : 'chunks'}`}
          </HighlightChip>
        </View>

        <Text style={styles.label}>TODAY STARTS {formatClock(BEST_TIMES[bestTime].minutes)}</Text>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {chunks.length === 0 ? (
            <Text style={styles.empty}>
              Nothing to plan yet — add some work and Chunk will cut it up.
            </Text>
          ) : (
            chunks.map((chunk) => (
              <View key={chunk.id} style={[styles.row, shadows.hardEdge(5)]}>
                <Chip className={chunk.className} />
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{chunk.title}</Text>
                  <Text style={styles.rowMeta}>{chunk.source}</Text>
                </View>
                <Text style={styles.rowMinutes}>{chunk.minutes}m</Text>
              </View>
            ))
          )}
        </ScrollView>

        <Button label="START MY PLAN" onPress={() => router.push('/paywall')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: { flex: 1, paddingTop: 16, paddingHorizontal: 24, paddingBottom: 32 },
  mascot: { height: 80, width: 80 },
  headlineBlock: { marginTop: 20 },
  headline: {
    fontFamily: fonts.display.extraBold,
    fontSize: 38,
    lineHeight: displayLine(38, 1.12),
    color: colors.ink,
  },
  label: {
    marginTop: 18,
    fontFamily: fonts.body.black,
    fontSize: 12,
    letterSpacing: 12 * 0.12,
    color: colors.mutedLight,
  },
  list: { paddingTop: 11, paddingBottom: 16, gap: 10 },
  empty: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 14 * 1.5,
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: radii.xl,
    padding: 14,
  },
  rowText: { flex: 1 },
  rowTitle: {
    fontFamily: fonts.body.extraBold,
    fontSize: 14.5,
    color: colors.ink,
  },
  rowMeta: {
    marginTop: 1,
    fontFamily: fonts.body.semiBold,
    fontSize: 12,
    color: colors.muted,
  },
  rowMinutes: {
    fontFamily: fonts.body.black,
    fontSize: 13,
    color: colors.muted,
  },
});
