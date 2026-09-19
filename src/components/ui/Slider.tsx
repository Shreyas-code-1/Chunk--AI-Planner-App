/**
 * Slider.
 *
 * Board values: a 12px track at radius 6 in `#F2E7DA`, an orange fill at the
 * same radius, and a 30x30 white thumb with a 3px orange border and its own
 * hard bottom edge (`0 4px 0 #6E4A28`), centred on the value.
 *
 * Dragging is handled with `react-native-gesture-handler`'s pan, which runs on
 * the UI thread — a slider that lags the finger feels broken in a way the
 * board cannot show.
 *
 * Detents fire the light haptic, per §7a.
 */

import { useCallback, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { haptic } from '../../lib/haptics';
import { colors, radii, shadows } from '../../theme/tokens';

const TRACK_HEIGHT = 12;
const THUMB = 30;

type Props = {
  /** Current value, in `min`..`max`. */
  value: number;
  min?: number;
  max?: number;
  /** Snap increment. 2.6's time-of-day slider steps in whole hours. */
  step?: number;
  onChange(value: number): void;
  style?: StyleProp<ViewStyle>;
};

export function Slider({ value, min = 0, max = 100, step = 1, onChange, style }: Props) {
  const [width, setWidth] = useState(0);
  const dragging = useSharedValue(false);

  const onLayout = useCallback((e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width), []);

  const commit = useCallback(
    (ratio: number) => {
      const raw = min + ratio * (max - min);
      const snapped = Math.min(max, Math.max(min, Math.round(raw / step) * step));
      if (snapped !== value) {
        haptic('select'); // one tick per detent crossed, never continuous
        onChange(snapped);
      }
    },
    [min, max, step, value, onChange],
  );

  const pan = Gesture.Pan()
    .onBegin(() => {
      dragging.value = true;
    })
    .onUpdate((e) => {
      if (width <= 0) return;
      runOnJS(commit)(Math.min(1, Math.max(0, e.x / width)));
    })
    .onFinalize(() => {
      dragging.value = false;
    });

  const ratio = max > min ? (value - min) / (max - min) : 0;
  const thumbStyle = useAnimatedStyle(() => ({
    // Reanimated owns only the press feel; the position is plain layout so it
    // stays correct on re-render.
    opacity: dragging.value ? 0.95 : 1,
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.hitArea, style]} onLayout={onLayout}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
        </View>
        <Animated.View
          style={[
            styles.thumb,
            shadows.hardEdge(4),
            { left: Math.max(0, ratio * width - THUMB / 2) },
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  // Taller than the track so the thumb has somewhere to sit and the finger
  // has something to catch.
  hitArea: { height: THUMB + 8, justifyContent: 'center' },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.orange,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.orange,
  },
});

// TODO(design): 2.6 BEST TIME OF DAY is a *range* slider with two thumbs. The
// COMPONENTS row only draws the single-thumb version, so the two-handle
// variant is flagged rather than invented.
