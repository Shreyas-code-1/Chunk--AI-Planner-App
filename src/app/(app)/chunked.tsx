/**
 * 3.7 THE CHUNKING MOMENT.
 *
 * What 3.6 just did, shown back. Every number on it is the planner's: the
 * hours in, the chunk count, each chunk's title, its minutes and the time it
 * is scheduled for. Nothing here is written by hand.
 *
 * The `N chunks` chip is stroked-artwork element 6 and is a runtime value, so
 * it renders through `HighlightChip` in the same draft fill as the rest —
 * see docs/stroked-elements.md, which is still waiting on a decision for the
 * two dynamic ones.
 */

import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppImage } from '../../components/ui/AppImage';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, HighlightChip } from '../../components/ui';
import { mascot } from '../../components/mascot';
import { usePlan } from '../../features/work/usePlan';
import { useWork } from '../../features/work/store';
import { planDateOf } from '../../lib/planDate';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

const TIME_FORMAT: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };

export default function Chunked() {
  const router = useRouter();
  const { assignment: assignmentId } = useLocalSearchParams<{ assignment?: string }>();

  const assignment = useWork((state) =>
    state.assignments.find((entry) => entry.id === assignmentId),
  );
  const { all, upNext } = usePlan();

  const chunks = all.filter((chunk) => chunk.assignmentId === assignmentId);
  const hours = assignment?.minutes ? assignment.minutes / 60 : 0;
  const hoursLabel = hours % 1 === 0 ? `${hours}` : hours.toFixed(1);
  const today = planDateOf(new Date());

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.bubbleRow}>
          <AppImage source={mascot.chunked} style={styles.mascot} resizeMode="contain" />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>
              {chunks.length === 0
                ? 'Nothing to cut up — this one has no time on it.'
                : `Chopped it up. Nothing here is longer than ${Math.max(
                    ...chunks.map((chunk) => chunk.plannedMinutes),
                  )} minutes.`}
            </Text>
          </View>
        </View>

        <View style={styles.headline}>
          <Text style={styles.headlineText}>
            {`${hoursLabel} ${hours === 1 ? 'hour' : 'hours'} became`}
          </Text>
          <HighlightChip fontSize={38} style={styles.chip}>
            {`${chunks.length} ${chunks.length === 1 ? 'chunk' : 'chunks'}`}
          </HighlightChip>
        </View>

        <View style={styles.list}>
          {chunks.map((chunk, position) => {
            const isNext = upNext?.key === chunk.key;
            const when =
              chunk.planDate === today
                ? `Today ${chunk.scheduledStart.toLocaleTimeString(undefined, TIME_FORMAT)}`
                : `${chunk.scheduledStart.toLocaleDateString(undefined, {
                    weekday: 'short',
                  })} ${chunk.scheduledStart.toLocaleTimeString(undefined, TIME_FORMAT)}`;

            return (
              <View
                key={chunk.key}
                style={[styles.row, isNext ? styles.rowNext : styles.rowPlain, shadows.hardEdge(5)]}
              >
                <View style={[styles.badge, isNext ? styles.badgeNext : styles.badgePlain]}>
                  <Text style={[styles.badgeLabel, isNext && styles.badgeLabelNext]}>
                    {position + 1}
                  </Text>
                </View>

                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{chunk.title}</Text>
                  <Text style={[styles.rowMeta, isNext && styles.rowMetaNext]}>
                    {isNext ? `${when} · up next` : when}
                  </Text>
                </View>

                <Text style={[styles.rowMinutes, isNext && styles.rowMetaNext]}>
                  {`${chunk.plannedMinutes}m`}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="SEE MY DAY" onPress={() => router.replace('/today')} />
        <Button label="ADD ANOTHER" variant="secondary" onPress={() => router.replace('/add')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 20 },

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  mascot: { height: 76, width: 76 },
  bubble: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: radii.xl,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  bubbleText: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 14 * 1.45,
    color: colors.ink,
  },

  headline: { marginTop: 18, alignItems: 'flex-start' },
  headlineText: {
    fontFamily: fonts.display.extraBold,
    fontSize: 38,
    lineHeight: displayLine(38, 1.12),
    color: colors.ink,
    includeFontPadding: false,
  },
  chip: { marginTop: 4 },

  list: { marginTop: 18, gap: 10 },
  row: {
    borderRadius: radii.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  rowPlain: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.cream },
  rowNext: { backgroundColor: colors.amber, borderWidth: 2, borderColor: colors.orange },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePlain: { backgroundColor: colors.amber },
  badgeNext: { backgroundColor: colors.orange },
  badgeLabel: { fontFamily: fonts.body.black, fontSize: 14, color: colors.orangeDeep },
  badgeLabelNext: { color: colors.white },
  rowText: { flex: 1 },
  rowTitle: { fontFamily: fonts.body.extraBold, fontSize: 14.5, color: colors.ink },
  rowMeta: { marginTop: 1, fontFamily: fonts.body.semiBold, fontSize: 12, color: colors.muted },
  rowMetaNext: { fontFamily: fonts.body.extraBold, color: colors.orangeDeep },
  rowMinutes: { fontFamily: fonts.body.black, fontSize: 13, color: colors.muted },

  footer: { paddingHorizontal: 22, paddingBottom: 20, paddingTop: 8, gap: 12 },
});
