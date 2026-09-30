/**
 * 5.2 PROFILE — the dock's You tab. At `/you` because `/profile` is 2.4.
 *
 * Name and grade come from onboarding. The board's school line ("Riverside
 * High") is never collected, so it is left out rather than invented.
 *
 * TODO(design): CONNECTED (Google Classroom, Canvas) has no integration
 * behind it, so both rows read "Not connected" and the toggles are disabled.
 * Preferences and Reminders lead to screens the board doesn't draw, and the
 * board has no sign-out or delete-account. All are in
 * docs/v2-and-remaining-screens-questions.md.
 */

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomDock, Toggle } from '../../components/ui';
import { useAiConsent, useAiEnabled } from '../../features/ai/consent';
import { useDockNavigation } from '../../features/navigation/useDockNavigation';
import { useDraft } from '../../features/onboarding/draft';
import { BadgeTile } from '../../features/work/BadgeTile';
import { badges, onTimeCount } from '../../features/work/progress';
import { useWork } from '../../features/work/store';
import { usePlan } from '../../features/work/usePlan';
import { colors, displayLine, fonts, shadows, subjectChips } from '../../theme/tokens';

const CONNECTIONS = [
  { name: 'Google Classroom', tint: colors.amber },
  { name: 'Canvas', tint: subjectChips.his.background },
] as const;

export default function You() {
  const dock = useDockNavigation('profile');
  const aiEnabled = useAiEnabled();
  const chooseAi = useAiConsent((s) => s.choose);
  const displayName = useDraft((s) => s.displayName);
  const grade = useDraft((s) => s.grade);
  const assignments = useWork((s) => s.assignments);
  const completions = useWork((s) => s.completions);
  const { all, allTimeChunks } = usePlan();

  // TODO(batch 6): a real streak needs completions that outlive the process.
  const streak = allTimeChunks > 0 ? 1 : 0;
  const chunkCounts = new Map<string, number>();
  for (const chunk of all)
    chunkCounts.set(chunk.assignmentId, (chunkCounts.get(chunk.assignmentId) ?? 0) + 1);
  const list = badges({
    allTimeChunks,
    streak,
    onTime: onTimeCount(assignments, completions, chunkCounts),
    longestMinutes: Math.max(0, ...completions.map((c) => c.actualMinutes)),
  });

  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        <View style={[styles.hero, shadows.hardEdge(7)]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLabel}>{initials || '?'}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.name}>{displayName || 'You'}</Text>
            {grade != null ? <Text style={styles.meta}>{`Grade ${grade}`}</Text> : null}
          </View>
        </View>

        <View style={styles.row}>
          <Stat value={streak} label="day streak" accent />
          <Stat value={allTimeChunks} label="chunks" />
          <Stat value={list.filter((b) => b.earned).length} label="badges" />
        </View>

        <Text style={styles.section}>BADGES</Text>
        <View style={[styles.row, styles.badges]}>
          {list.map((badge) => (
            <BadgeTile key={badge.key} badge={badge} />
          ))}
        </View>

        <Text style={styles.section}>CONNECTED</Text>
        <View style={styles.connections}>
          {CONNECTIONS.map((c) => (
            <View key={c.name} style={[styles.card, styles.connection, shadows.hardEdge(5)]}>
              <View style={[styles.connIcon, { backgroundColor: c.tint }]} />
              <View style={styles.flex}>
                <Text style={styles.connName}>{c.name}</Text>
                <Text style={styles.connMeta}>Not connected</Text>
              </View>
              <Toggle value={false} onChange={() => {}} disabled accessibilityLabel={c.name} />
            </View>
          ))}
        </View>

        {/* TODO(design): not on the board; built from the CONNECTED row. */}
        <Text style={styles.section}>AI</Text>
        <View style={[styles.card, styles.connection, styles.aiRow, shadows.hardEdge(5)]}>
          <View style={styles.flex}>
            <Text style={styles.connName}>Scan and voice</Text>
            <Text style={styles.connMeta}>
              {aiEnabled ? 'On · sent to Anthropic' : "Off · you'll type everything"}
            </Text>
          </View>
          <Toggle value={aiEnabled} onChange={chooseAi} accessibilityLabel="Scan and voice" />
        </View>

        <View style={[styles.row, styles.links]}>
          {['Preferences', 'Reminders'].map((label) => (
            <View key={label} style={[styles.card, styles.link, shadows.hardEdge(4)]}>
              <Text style={styles.linkLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomDock active="profile" style={styles.dock} {...dock} />
    </SafeAreaView>
  );
}

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <View style={[styles.card, styles.stat, shadows.hardEdge(5)]}>
      <Text style={[styles.statValue, accent && styles.statAccent]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 },
  flex: { flex: 1 },
  title: { fontFamily: fonts.display.extraBold, fontSize: 26, color: colors.ink },

  hero: {
    marginTop: 16,
    backgroundColor: colors.orange,
    borderRadius: 26,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: { fontFamily: fonts.body.black, fontSize: 22, color: colors.orangeDeep },
  name: {
    fontFamily: fonts.display.extraBold,
    fontSize: 26,
    lineHeight: displayLine(26, 1.1),
    color: colors.white,
  },
  meta: { marginTop: 2, fontFamily: fonts.body.bold, fontSize: 13, color: 'rgba(255,255,255,0.9)' },

  row: { marginTop: 14, flexDirection: 'row', gap: 10 },
  card: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.cream },
  stat: { flex: 1, borderRadius: 20, padding: 14, alignItems: 'center' },
  statValue: {
    fontFamily: fonts.display.extraBold,
    fontSize: 24,
    lineHeight: displayLine(24, 1),
    color: colors.ink,
  },
  statAccent: { color: colors.orange },
  statLabel: { marginTop: 3, fontFamily: fonts.body.extraBold, fontSize: 11, color: colors.muted },

  section: {
    marginTop: 14,
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.12,
    color: colors.mutedLight,
  },
  badges: { marginTop: 9, gap: 9 },

  connections: { marginTop: 10, gap: 10 },
  connection: {
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiRow: { marginTop: 10 },
  connIcon: { width: 38, height: 38, borderRadius: 14 },
  connName: { fontFamily: fonts.body.extraBold, fontSize: 14.5, color: colors.ink },
  connMeta: { marginTop: 1, fontFamily: fonts.body.bold, fontSize: 12, color: colors.muted },

  links: { marginTop: 12, paddingBottom: 10 },
  link: { flex: 1, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14 },
  linkLabel: { fontFamily: fonts.body.extraBold, fontSize: 13.5, color: colors.ink },

  dock: { marginHorizontal: 20, marginBottom: 10 },
});
