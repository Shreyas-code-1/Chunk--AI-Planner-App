/**
 * 5.2 PROFILE — the dock's You tab, v3 design (design/v3/profile.png). At
 * `/you` because `/profile` is 2.4. The gear opens 5.2a SETTINGS.
 *
 * Every figure is real (`useProgressStats`); the design's are samples.
 * TODO(design): the "@handle" — the app collects no username, so the line
 * reads "JOINED 2026" alone. Asked in docs/v2-and-remaining-screens-questions.md.
 */

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { CalendarCheck, Check, Flame, Timer } from '../../components/icons';
import { LogIcon } from '../../features/logs/LogIcon';
import { useDraft } from '../../features/onboarding/draft';
import { OverviewTile } from '../../features/profile/OverviewTile';
import { ProfileHeader } from '../../features/profile/ProfileHeader';
import { BadgeTile } from '../../features/work/BadgeTile';
import { hoursShortLabel } from '../../features/work/progress';
import { useProgressStats } from '../../features/work/useProgressStats';
import { colors, fonts, radii } from '../../theme/tokens';

const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;

export default function You() {
  const router = useRouter();
  const displayName = useDraft((s) => s.displayName);
  const stats = useProgressStats();
  const { onTime } = stats;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ProfileHeader name={displayName} onSettings={() => router.push('/settings')} />

        <View style={styles.body}>
          {stats.joinedAt ? (
            <Text style={styles.handle}>{`JOINED ${stats.joinedAt.getFullYear()}`}</Text>
          ) : null}

          <Text style={styles.section}>OVERVIEW</Text>
          <View style={styles.grid}>
            <View style={styles.row}>
              <OverviewTile icon={<Flame size={20} drop={false} />} value={days(stats.streak)} label="Streak" />
              <OverviewTile icon={<LogIcon size={24} />} value={`${stats.logBalance}`} label="Logs" />
            </View>
            <View style={styles.row}>
              <OverviewTile
                icon={
                  <View style={styles.check}>
                    <Check size={15} color={colors.white} strokeWidth={3.4} />
                  </View>
                }
                value={`${stats.allTimeChunks}`}
                label="Chunks done"
              />
              <OverviewTile
                icon={<Timer size={23} color={colors.tealDeep} strokeWidth={2.8} />}
                value={hoursShortLabel(stats.focused)}
                label="Focused"
              />
            </View>
            <View style={styles.row}>
              <OverviewTile
                icon={<Flame size={20} drop={false} color={colors.flameGold} />}
                value={days(stats.bestStreak)}
                label="Best streak"
              />
              <OverviewTile
                icon={<CalendarCheck size={22} />}
                // TODO(design): no value is drawn for "nothing finished or due yet".
                value={onTime.total ? `${Math.round((onTime.onTime / onTime.total) * 100)}%` : '–'}
                label="Finished on time"
              />
            </View>
          </View>

          <Text style={[styles.section, styles.badgesLabel]}>BADGES</Text>
          <View style={styles.badges}>
            {stats.badges.map((badge) => (
              <BadgeTile key={badge.key} badge={badge} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  scroll: { paddingBottom: 18 },
  body: { paddingHorizontal: 21 },
  handle: {
    marginTop: 19,
    fontFamily: fonts.body.black,
    fontSize: 13,
    letterSpacing: 13 * 0.04,
    color: colors.muted,
  },
  section: {
    marginTop: 20,
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.12,
    color: colors.mutedLight,
  },
  grid: { marginTop: 13, gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  check: {
    width: 20,
    height: 20,
    borderRadius: radii.xs,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesLabel: { marginTop: 23 },
  badges: { marginTop: 13, flexDirection: 'row', gap: 9 },
});
