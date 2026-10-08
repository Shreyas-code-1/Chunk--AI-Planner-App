/**
 * The + screen: Assignment or Event, opening on whichever was used last.
 *
 * Assignment is 3.6 ADD ASSIGNMENT, unchanged. Event is new
 * (docs/events-plan.md).
 *
 * TODO(design): the board draws no tabs here. They reuse the chip row.
 */

import { View } from 'react-native';

import { EventForm } from '../../features/events/EventForm';
import { useEvents, type AddTab } from '../../features/events/store';
import { AddAssignmentForm, Choice, formStyles } from '../../features/work/AddAssignmentForm';

const TABS: readonly (readonly [AddTab, string])[] = [
  ['assignment', 'Assignment'],
  ['event', 'Event'],
];

export default function Add() {
  const tab = useEvents((state) => state.lastAddTab);
  const setTab = useEvents((state) => state.setLastAddTab);

  const tabs = (
    <View style={formStyles.chips} accessibilityRole="tablist">
      {TABS.map(([key, label]) => (
        <Choice key={key} label={label} selected={tab === key} onPress={() => setTab(key)} />
      ))}
    </View>
  );

  return tab === 'event' ? <EventForm tabs={tabs} /> : <AddAssignmentForm tabs={tabs} />;
}
