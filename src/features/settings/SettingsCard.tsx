/**
 * The grouped cards on v3 5.2a SETTINGS (design/v3/settings.png): white,
 * 1pt cream border, radius 22, a 5pt cream edge, 1pt track dividers.
 * A row without `onPress` and without `right` renders as plain text — the
 * rows still waiting on a destination are listed in
 * docs/v2-and-remaining-screens-questions.md.
 */

import { Children, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRight } from '../../components/icons';
import { haptic } from '../../lib/haptics';
import { colors, fonts, radii, shadows } from '../../theme/tokens';

export function SettingsCard({ children }: { children: ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <View style={[styles.card, shadows.hardEdge(5, colors.cream)]}>
      {rows.map((row, i) => (
        <View key={i} style={i > 0 && styles.divider}>
          {row}
        </View>
      ))}
    </View>
  );
}

type RowProps = { title: string; subtitle?: string; onPress?: () => void; right?: ReactNode };

export function SettingsRow({ title, subtitle, onPress, right }: RowProps) {
  const body = (
    <>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <ChevronRight size={20} color={colors.mutedLight} strokeWidth={2.4} /> : null)}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPressIn={() => haptic('select')}
      onPress={onPress}
      style={styles.row}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cream,
    borderRadius: radii.xxl,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.track },
  row: {
    paddingVertical: 15,
    paddingLeft: 20,
    paddingRight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: { flex: 1 },
  title: { fontFamily: fonts.body.extraBold, fontSize: 15, lineHeight: 20, color: colors.ink },
  subtitle: {
    marginTop: 2,
    fontFamily: fonts.body.bold,
    fontSize: 12,
    lineHeight: 17,
    color: colors.subtle,
  },
});
