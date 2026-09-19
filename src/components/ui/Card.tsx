/**
 * The cream-and-white card.
 *
 * The board uses two treatments and they are not interchangeable:
 *  - `outlined` — white fill with a 2px cream border. The quiet default, used
 *    for list rows and information.
 *  - `raised` — white fill with the same hard bottom edge as a button. Used
 *    where the card is pressable or is the focus of the screen.
 */

import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { colors, radii, shadows } from '../../theme/tokens';

type Props = {
  children: ReactNode;
  variant?: 'outlined' | 'raised';
  /** The board uses 20 and 22 in roughly equal measure; callers pick. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, variant = 'outlined', radius = radii.xl, style }: Props) {
  return (
    <View
      style={[
        styles.base,
        { borderRadius: radius },
        variant === 'outlined' ? styles.outlined : shadows.hardEdge(5),
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.card,
    padding: 14,
  },
  outlined: {
    borderWidth: 2,
    borderColor: colors.cream,
  },
});
