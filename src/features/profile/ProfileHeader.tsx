/**
 * The amber top of v3 5.2 PROFILE: name, the gear, and the empty-avatar
 * placeholder (design/v3/profile.png). Measured from the @2x export against a
 * 44pt status bar; everything below the safe area keeps the design's offsets.
 *
 * TODO(design): the avatar's plus has nothing behind it yet — no photo
 * picker or storage. Asked in docs/v2-and-remaining-screens-questions.md.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Gear } from '../../components/icons';
import { haptic } from '../../lib/haptics';
import { colors, displayLine, fonts, radii, shadows } from '../../theme/tokens';

/** Header height below the safe area: 318pt in the design, less its 44pt status bar. */
const BODY_HEIGHT = 274;
const W = 180;
const H = 212;
const CX = W / 2;
const HEAD_Y = 68;
const DASH = '10 7';

export function ProfileHeader({ name, onSettings }: { name: string; onSettings(): void }) {
  const insets = useSafeAreaInsets();
  const [first, ...rest] = name.trim().split(/\s+/);

  return (
    <View style={[styles.header, { height: insets.top + BODY_HEIGHT, paddingTop: insets.top }]}>
      <Text style={styles.name}>{rest.length ? `${first}\n${rest.join(' ')}` : first || 'You'}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Settings"
        onPressIn={() => haptic('select')}
        onPress={onSettings}
        style={[styles.gear, { top: insets.top + 4 }, shadows.hardEdge(4, colors.gearEdge)]}
      >
        <Gear size={22} color={colors.edgeBrown} strokeWidth={2.2} />
      </Pressable>

      <Svg width={W} height={H} style={styles.avatar}>
        <Path
          d={`M${CX - 84} ${H} L${CX - 84} 204 A84 84 0 0 1 ${CX + 84} 204 L${CX + 84} ${H}`}
          stroke={colors.orange}
          strokeWidth={3}
          strokeDasharray={DASH}
          fill="none"
        />
        <Path
          d={`M${CX - 72} ${H} L${CX - 72} 204 A72 72 0 0 1 ${CX + 72} 204 L${CX + 72} ${H} Z`}
          fill={colors.avatarFill}
        />
        <Circle cx={CX} cy={HEAD_Y} r={62} stroke={colors.orange} strokeWidth={3} strokeDasharray={DASH} fill={colors.amber} />
        <Circle cx={CX} cy={HEAD_Y} r={50} fill={colors.avatarFill} />
        <Line x1={CX - 18.5} y1={HEAD_Y} x2={CX + 18.5} y2={HEAD_Y} stroke={colors.white} strokeWidth={8} strokeLinecap="round" />
        <Line x1={CX} y1={HEAD_Y - 18.5} x2={CX} y2={HEAD_Y + 18.5} stroke={colors.white} strokeWidth={8} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.amber, overflow: 'hidden' },
  name: {
    marginTop: 8,
    marginLeft: 23,
    fontFamily: fonts.display.extraBold,
    fontSize: 31,
    lineHeight: displayLine(31, 1.08),
    color: colors.ink,
    includeFontPadding: false,
  },
  gear: {
    position: 'absolute',
    right: 21,
    width: 47,
    height: 47,
    borderRadius: radii.mdAlt,
    borderWidth: 1,
    borderColor: colors.gearBorder,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { position: 'absolute', bottom: 0, alignSelf: 'center' },
});
