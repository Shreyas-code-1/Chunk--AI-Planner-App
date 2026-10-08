/**
 * Events on 3.2 TODAY — PATH.
 *
 * Clearly not chunks: no node, no play, no lock, never startable. A calm tan
 * card with the start time down the left where a chunk has its node.
 *
 * TODO(design): the board draws no event block, all-day banner, or "just this
 * one / all events" prompt. Built from the path card and the locked-node tan.
 */

import { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { haptic } from '../../lib/haptics';
import { timeLabel } from '../../lib/clock';
import type { EventOccurrence } from '../../planner/events';
import { colors, fonts, radii } from '../../theme/tokens';
import { eventTimes } from './copy';

/** Opens an event for editing, asking which ones first when it repeats. */
export function useOpenEvent() {
  const router = useRouter();
  return useCallback(
    (event: EventOccurrence) => {
      const open = (scope: 'one' | 'all') =>
        router.push({
          pathname: '/event',
          params: { id: event.seriesId, date: event.occurrenceDate, scope },
        });
      if (!event.repeating) return open('all');
      Alert.alert(event.title, 'Change just this one, or every time it repeats?', [
        { text: 'Just this one', onPress: () => open('one') },
        { text: 'All events in the series', onPress: () => open('all') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [router],
  );
}

export function EventBlock({ event, onPress }: { event: EventOccurrence; onPress(): void }) {
  const times = eventTimes(event.start, event.end, timeLabel);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${times}. Edit event.`}
      onPressIn={() => haptic('select')}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.time}>
        <Text style={styles.timeText}>{timeLabel(event.start)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.meta}>{event.note ? `${times} · ${event.note}` : times}</Text>
      </View>
    </Pressable>
  );
}

export function AllDayBanner({
  events,
  onOpen,
}: {
  events: EventOccurrence[];
  onOpen(event: EventOccurrence): void;
}) {
  return (
    <>
      {events.map((event) => (
        <Pressable
          key={`${event.seriesId}:${event.occurrenceDate}`}
          accessibilityRole="button"
          accessibilityLabel={`All day: ${event.title}. Edit event.`}
          onPressIn={() => haptic('select')}
          onPress={() => onOpen(event)}
          style={[styles.card, styles.banner]}
        >
          <Text style={styles.bannerLabel}>ALL DAY</Text>
          <Text style={styles.title}>{event.title}</Text>
        </Pressable>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  // Same width as a path node, so cards line up down the path.
  time: { width: 60, alignItems: 'center' },
  timeText: { fontFamily: fonts.body.black, fontSize: 12, color: colors.mutedWarm },
  card: {
    flex: 1,
    backgroundColor: colors.locked,
    borderWidth: 2,
    borderColor: colors.cream,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 13,
  },
  title: { fontFamily: fonts.body.extraBold, fontSize: 13.5, color: colors.ink },
  meta: { marginTop: 1, fontFamily: fonts.body.bold, fontSize: 11.5, color: colors.mutedWarm },
  banner: { marginTop: 12, flex: 0, borderRadius: radii.xl },
  bannerLabel: {
    fontFamily: fonts.body.black,
    fontSize: 11,
    letterSpacing: 11 * 0.12,
    color: colors.mutedWarm,
  },
});
