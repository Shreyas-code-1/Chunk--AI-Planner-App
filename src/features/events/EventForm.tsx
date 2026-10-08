/**
 * The Event tab of the + screen, and the edit screen for an event.
 *
 * TODO(design): the board draws no event form. Built from Add Assignment's
 * header, labels, field, chips, toggle and button, so it reads as a sibling.
 */

import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Toggle } from '../../components/ui';
import { ChevronLeft } from '../../components/icons';
import { safeBack } from '../navigation/safeBack';
import { haptic } from '../../lib/haptics';
import { timeLabel } from '../../lib/clock';
import { fromDateKey, toDateKey } from '../../lib/planDate';
import { atMinutes } from '../../planner/events';
import { colors, shadows } from '../../theme/tokens';
import { formStyles as styles } from '../work/AddAssignmentForm';
import { PickerField } from './PickerField';
import { RepeatFields } from './RepeatFields';
import { useEventForm, type Editing } from './useEventForm';

const DATE_FORMAT: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
const minutesOf = (d: Date) => d.getHours() * 60 + d.getMinutes();

export function EventForm({ tabs, editing = null }: { tabs?: ReactNode; editing?: Editing | null }) {
  const router = useRouter();
  const { form, set, problem, save, remove } = useEventForm(editing);
  const single = editing?.scope === 'one' && editing.series.repeat.freq !== 'none';
  const done = () => safeBack(router, '/today');

  const time = (key: 'startMinutes' | 'endMinutes', label: string) => (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <PickerField
        mode="time"
        label={label}
        value={atMinutes(form.date, form[key])}
        display={timeLabel(atMinutes(form.date, form[key]))}
        onChange={(d) => set(key, minutesOf(d))}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => {
              haptic('select');
              safeBack(router, '/home');
            }}
            style={styles.back}
          >
            <ChevronLeft size={16} color={colors.ink} strokeWidth={2.8} />
          </Pressable>
          <Text style={styles.title}>{editing ? (single ? 'Edit this event' : 'Edit event') : 'New event'}</Text>
        </View>
        {tabs}

        <Text style={styles.label}>WHAT IS IT?</Text>
        <View style={[styles.field, styles.fieldFocus, shadows.hardEdge(5)]}>
          <TextInput
            accessibilityLabel="Event name"
            value={form.title}
            onChangeText={(text) => set('title', text)}
            placeholder="Soccer practice"
            placeholderTextColor={colors.mutedLight}
            style={styles.fieldText}
          />
        </View>

        {single ? null : (
          <>
            <Text style={styles.label}>{form.repeatKind === 'never' ? 'DATE' : 'STARTS ON'}</Text>
            <PickerField
              mode="date"
              label="Date"
              value={fromDateKey(form.date)}
              display={fromDateKey(form.date).toLocaleDateString(undefined, DATE_FORMAT)}
              onChange={(d) => set('date', toDateKey(d))}
            />
          </>
        )}

        <View style={[styles.chips, { alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }]}>
          <Text style={[styles.label, { marginTop: 0 }]}>ALL DAY</Text>
          <Toggle accessibilityLabel="All day" value={form.allDay} onChange={(v) => set('allDay', v)} />
        </View>
        {form.allDay ? (
          <Text style={[styles.chipLabel, { marginTop: 6 }]}>
            Shows at the top of the day. Chunk still plans homework around it.
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {time('startMinutes', 'STARTS')}
            {time('endMinutes', 'ENDS')}
          </View>
        )}

        {single ? null : <RepeatFields form={form} set={set} />}

        <Text style={styles.label}>NOTE</Text>
        <View style={[styles.field, styles.notes, shadows.hardEdge(5)]}>
          <TextInput
            accessibilityLabel="Note"
            value={form.note}
            onChangeText={(text) => set('note', text)}
            placeholder="Bring cleats"
            placeholderTextColor={colors.mutedLight}
            style={[styles.fieldText, styles.notesText]}
            multiline
          />
        </View>

        {/* TODO(design): the board draws no error state for a field. */}
        {problem ? <Text style={styles.problem}>{problem}</Text> : null}

        {editing ? (
          // TODO(design): no destructive button on the board; the secondary one stands in.
          <Button
            label={single ? 'DELETE THIS ONE' : 'DELETE EVENT'}
            variant="secondary"
            style={{ marginTop: 22 }}
            onPress={() => {
              remove();
              done();
            }}
          />
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button label="SAVE EVENT" onPress={() => save() && done()} />
      </View>
    </SafeAreaView>
  );
}
