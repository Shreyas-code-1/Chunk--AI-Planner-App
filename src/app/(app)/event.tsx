/**
 * Editing an event, reached by tapping it on Today's Path. `scope` is the
 * student's answer to "Just this one" or "All events in the series".
 */

import { useLocalSearchParams } from 'expo-router';

import { EventForm } from '../../features/events/EventForm';
import { useEvents } from '../../features/events/store';

export default function EditEvent() {
  const { id, date, scope } = useLocalSearchParams<{ id: string; date: string; scope: string }>();
  const series = useEvents((state) => state.series.find((s) => s.id === id));
  // Deleted while open: nothing to edit, and the screen pops itself.
  if (!series) return null;
  return (
    <EventForm
      key={`${id}:${date}:${scope}`}
      editing={{ series, occurrenceDate: date, scope: scope === 'one' ? 'one' : 'all' }}
    />
  );
}
