/**
 * One badge on 5.2 PROFILE: an icon square over its name. Earned badges get
 * the filled square; unearned ones the dashed "Deep work" look. Sizes are the
 * v3 design's (design/v3/profile.png): 46pt icon, 1pt borders.
 */

import { StyleSheet, Text, View } from 'react-native';

import { Check, Lock, Timer } from '../../components/icons';
import { colors, fonts, radii, shadows } from '../../theme/tokens';
import { BADGE_RULES, type Badge } from './progress';

export function BadgeTile({ badge }: { badge: Badge }) {
  if (!badge.earned) {
    return (
      <View style={[styles.tile, styles.locked]} accessibilityLabel={`${badge.label}, locked`}>
        <View style={[styles.icon, { backgroundColor: colors.locked }]}>
          <Lock size={20} color={colors.mutedLight} strokeWidth={2.4} />
        </View>
        <Text style={[styles.label, styles.lockedLabel]}>{badge.label}</Text>
      </View>
    );
  }

  const green = badge.key === 'onTime';
  return (
    <View
      style={[styles.tile, styles.earned, shadows.hardEdge(5)]}
      accessibilityLabel={badge.label}
    >
      <View
        style={[
          styles.icon,
          { backgroundColor: green ? colors.success : colors.orange },
          shadows.hardEdge(4, green ? colors.successDeep : colors.edgeBrown),
        ]}
      >
        {badge.key === 'first' ? <Check size={22} color={colors.white} strokeWidth={3.4} /> : null}
        {badge.key === 'week' ? (
          <Text style={styles.number}>{BADGE_RULES.weekStreakDays}</Text>
        ) : null}
        {badge.key === 'onTime' || badge.key === 'deep' ? (
          <Timer size={23} color={colors.white} strokeWidth={2.6} />
        ) : null}
      </View>
      <Text style={styles.label}>{badge.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.xl,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  earned: { backgroundColor: colors.card, borderColor: colors.cream },
  locked: {
    backgroundColor: colors.lockedSoft,
    borderColor: colors.creamDeep,
    borderStyle: 'dashed',
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { fontFamily: fonts.body.black, fontSize: 17, color: colors.white },
  label: {
    marginTop: 9,
    fontFamily: fonts.body.black,
    fontSize: 11,
    color: colors.ink,
    textAlign: 'center',
  },
  lockedLabel: { color: colors.mutedLight },
});
