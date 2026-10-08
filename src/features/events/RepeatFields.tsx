/**
 * Repeat: Never / Daily / Weekly (pick days) / Custom (every N days or weeks),
 * and when it ends: never, on a date, or after N times.
 *
 * TODO(design): the board draws no repeat control. Built from the Add
 * Assignment chip row and field styles.
 */

import { Text, TextInput, View } from 'react-native';

import { fromDateKey, toDateKey } from '../../lib/planDate';
import { colors } from '../../theme/tokens';
import { Choice, formStyles as styles } from '../work/AddAssignmentForm';
import { PickerField } from './PickerField';
import type { EndKind, EventFormState, RepeatKind } from './useEventForm';

const KINDS: readonly (readonly [RepeatKind, string])[] = [
  ['never', 'Never'],
  ['daily', 'Daily'],
  ['weekly', 'Weekly'],
  ['custom', 'Custom'],
];
const ENDS: readonly (readonly [EndKind, string])[] = [
  ['never', 'Never'],
  ['on', 'On a date'],
  ['after', 'After'],
];
/** Monday first, like the week strip; values are Date#getDay. */
const WEEKDAYS: readonly (readonly [number, string])[] = [
  [1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [0, 'Sun'],
];

const SHORT_DATE: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };

function NumberBox({ value, onChange, label }: { value: string; onChange(v: string): void; label: string }) {
  return (
    <View style={[styles.field, { paddingVertical: 10, paddingHorizontal: 14, marginTop: 0 }]}>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        maxLength={3}
        style={[styles.fieldText, { minWidth: 28, textAlign: 'center' }]}
        placeholderTextColor={colors.mutedLight}
      />
    </View>
  );
}

export function RepeatFields({ form, set }: Pick<EventFormState, 'form' | 'set'>) {
  const showDays = form.repeatKind === 'weekly' || (form.repeatKind === 'custom' && form.unit === 'weeks');
  const toggleDay = (day: number) =>
    set('weekdays', form.weekdays.includes(day) ? form.weekdays.filter((d) => d !== day) : [...form.weekdays, day]);

  return (
    <>
      <Text style={styles.label}>REPEAT</Text>
      <View style={styles.chips}>
        {KINDS.map(([kind, label]) => (
          <Choice key={kind} label={label} selected={form.repeatKind === kind} onPress={() => set('repeatKind', kind)} />
        ))}
      </View>

      {form.repeatKind === 'custom' ? (
        <View style={[styles.chips, { alignItems: 'center' }]}>
          <Text style={styles.chipLabel}>Every</Text>
          <NumberBox label="Repeat every" value={form.every} onChange={(v) => set('every', v)} />
          <Choice label="Days" selected={form.unit === 'days'} onPress={() => set('unit', 'days')} />
          <Choice label="Weeks" selected={form.unit === 'weeks'} onPress={() => set('unit', 'weeks')} />
        </View>
      ) : null}

      {showDays ? (
        <View style={styles.chips}>
          {WEEKDAYS.map(([day, label]) => (
            <Choice key={day} label={label} selected={form.weekdays.includes(day)} onPress={() => toggleDay(day)} />
          ))}
        </View>
      ) : null}

      {form.repeatKind !== 'never' ? (
        <>
          <Text style={styles.label}>ENDS</Text>
          <View style={styles.chips}>
            {ENDS.map(([kind, label]) => (
              <Choice key={kind} label={label} selected={form.endKind === kind} onPress={() => set('endKind', kind)} />
            ))}
          </View>
          {form.endKind === 'on' ? (
            <PickerField
              mode="date"
              label="Last day"
              value={fromDateKey(form.endDate)}
              display={fromDateKey(form.endDate).toLocaleDateString(undefined, SHORT_DATE)}
              onChange={(d) => set('endDate', toDateKey(d))}
            />
          ) : null}
          {form.endKind === 'after' ? (
            <View style={[styles.chips, { alignItems: 'center' }]}>
              <NumberBox label="Number of times" value={form.endCount} onChange={(v) => set('endCount', v)} />
              <Text style={styles.chipLabel}>times</Text>
            </View>
          ) : null}
        </>
      ) : null}
    </>
  );
}
