/**
 * 3.5 ALL WORK.
 *
 * Every assignment, grouped by the day its next chunk falls on, with the
 * board's two filters. "Done" means every chunk of it is finished, which is
 * derived from completions rather than stored as a flag — an assignment has
 * no done column, and giving it one would let the two disagree.
 *
 * TODO(design): the board tints the "Lab safety quiz" row red for urgency.
 * That is 5.4 URGENT DEADLINE's treatment, which is not built and whose
 * threshold (Q16, six hours) is answered but has no frame here, so rows are
 * drawn in the plain treatment and urgency is not coloured yet.
 */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomDock, Chip } from '../../components/ui';
import { usePlan } from '../../features/work/usePlan';
import { useWork } from '../../features/work/store';
import { addDays, planDateOf } from '../../lib/planDate';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

type Tab = 'upcoming' | 'done';

const DAY_FORMAT: Intl.DateTimeFormatOptions = { weekday: 'short' };

export default function AllWork() {
  const router = useRouter();
  const assignments = useWork((state) => state.assignments);
  const { all } = usePlan();

  const [filter, setFilter] = useState<Tab>('upcoming');

  const today = planDateOf(new Date());
  const tomorrow = addDays(today, 1);

  const rows = useMemo(() => {
    return assignments.map((assignment) => {
      const chunks = all.filter((chunk) => chunk.assignmentId === assignment.id);
      const done = chunks.filter((chunk) => chunk.done).length;
      const left = chunks.length - done;
      const minutesLeft = chunks
        .filter((chunk) => !chunk.done)
        .reduce((total, chunk) => total + chunk.plannedMinutes, 0);
      const next = chunks.find((chunk) => !chunk.done);

      return {
        assignment,
        chunks,
        done,
        left,
        minutesLeft,
        percent: chunks.length === 0 ? 0 : Math.round((done / chunks.length) * 100),
        // Undone work groups by when the next chunk runs; finished work has
        // no next chunk, so it groups under its due day.
        groupKey: next?.planDate ?? planDateOf(assignment.dueAt),
        isDone: chunks.length > 0 && left === 0,
      };
    });
  }, [assignments, all]);

  const visible = rows.filter((row) => (filter === 'done' ? row.isDone : !row.isDone));
  const doneCount = rows.filter((row) => row.isDone).length;
  const hoursLeft = rows
    .filter((row) => !row.isDone)
    .reduce((total, row) => total + row.minutesLeft, 0);

  const groups = useMemo(() => {
    const byDay = new Map<string, typeof visible>();
    for (const row of visible) {
      byDay.set(row.groupKey, [...(byDay.get(row.groupKey) ?? []), row]);
    }
    return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [visible]);

  const groupLabel = (key: string) => {
    if (key === today) return 'TODAY';
    if (key === tomorrow) return 'TOMORROW';
    return new Date(`${key}T12:00:00`).toLocaleDateString(undefined, DAY_FORMAT).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>All work</Text>
          <Text style={styles.remaining}>
            {hoursLeft === 0 ? 'NOTHING LEFT' : `${Math.round((hoursLeft / 60) * 10) / 10} HR LEFT`}
          </Text>
        </View>

        <View style={styles.filters}>
          <FilterTab
            label="Upcoming"
            selected={filter === 'upcoming'}
            onPress={() => setFilter('upcoming')}
          />
          <FilterTab
            label={`Done · ${doneCount}`}
            selected={filter === 'done'}
            onPress={() => setFilter('done')}
          />
        </View>

        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyLine}>
              {filter === 'done'
                ? 'Nothing finished yet.'
                : 'No work yet. Tap the plus to add your first assignment.'}
            </Text>
          </View>
        ) : (
          groups.map(([key, group]) => (
            <View key={key} style={styles.group}>
              <Text style={styles.groupLabel}>{groupLabel(key)}</Text>

              {group.map((row) => (
                <Pressable
                  key={row.assignment.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${row.assignment.title}, ${row.left} chunks left`}
                  onPress={() =>
                    router.push({
                      pathname: '/chunked',
                      params: { assignment: row.assignment.id },
                    })
                  }
                  style={[styles.card, shadows.hardEdge(6)]}
                >
                  <View style={styles.cardRow}>
                    <Chip className={row.assignment.className ?? 'Other'} />
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{row.assignment.title}</Text>
                      <Text style={styles.cardMeta}>
                        {row.isDone
                          ? `${row.chunks.length} ${row.chunks.length === 1 ? 'chunk' : 'chunks'} done`
                          : `${row.left} ${row.left === 1 ? 'chunk' : 'chunks'} left · ${row.minutesLeft} min · due ${row.assignment.dueAt.toLocaleDateString(undefined, DAY_FORMAT)}`}
                      </Text>
                    </View>
                    <Text style={styles.percent}>{`${row.percent}%`}</Text>
                  </View>

                  <View style={styles.segments}>
                    {row.chunks.map((chunk) => (
                      <View
                        key={chunk.key}
                        style={[
                          styles.segment,
                          chunk.done ? styles.segmentDone : styles.segmentTodo,
                        ]}
                      />
                    ))}
                  </View>
                </Pressable>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <BottomDock
        active="focus"
        style={styles.dock}
        onSelect={(tab) => {
          if (tab === 'home') router.replace('/home');
          if (tab === 'week') router.replace('/today');
        }}
        onAdd={() => router.push('/add')}
      />
    </SafeAreaView>
  );
}

function FilterTab({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.filter, selected ? styles.filterOn : styles.filterOff]}
    >
      <Text style={[styles.filterLabel, selected && styles.filterLabelOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  body: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 },

  headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  title: {
    fontFamily: fonts.display.extraBold,
    fontSize: 28,
    lineHeight: displayLine(28, 1.1),
    color: colors.ink,
    includeFontPadding: false,
  },
  remaining: { fontFamily: fonts.body.black, fontSize: 12.5, color: colors.muted },

  filters: { marginTop: 12, flexDirection: 'row', gap: 9 },
  filter: { borderRadius: radii.pill, paddingVertical: 10, paddingHorizontal: 16 },
  filterOn: { backgroundColor: colors.ink },
  filterOff: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    paddingVertical: 9,
  },
  filterLabel: { fontFamily: fonts.body.black, fontSize: 12.5, color: colors.muted },
  filterLabelOn: { color: colors.white },

  group: { marginTop: 14 },
  groupLabel: {
    marginBottom: 7,
    fontFamily: fonts.body.black,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.12,
    color: colors.mutedLight,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: radii.xxl,
    padding: 16,
    marginBottom: 10,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardText: { flex: 1 },
  cardTitle: { fontFamily: fonts.body.extraBold, fontSize: 16, color: colors.ink },
  cardMeta: { marginTop: 1, fontFamily: fonts.body.semiBold, fontSize: 12, color: colors.muted },
  percent: { fontFamily: fonts.display.extraBold, fontSize: 22, color: colors.orange },

  segments: { marginTop: 12, flexDirection: 'row', gap: 5 },
  segment: { flex: 1, height: 9, borderRadius: 5 },
  segmentDone: { backgroundColor: colors.orange },
  segmentTodo: { backgroundColor: colors.track },

  empty: {
    marginTop: 16,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: radii.xxl,
    padding: 18,
  },
  emptyLine: {
    fontFamily: fonts.body.bold,
    fontSize: 13.5,
    lineHeight: 13.5 * 1.45,
    color: colors.muted,
  },

  dock: { marginHorizontal: 20, marginBottom: 10 },
});
