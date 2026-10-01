/**
 * Every bundled image goes through this, not React Native's `Image`.
 *
 * RN's Image re-fetches a bundled asset each time a screen mounts — in Expo Go
 * that is a request to the dev server — so the dock icons, the log and the
 * mascot could come back blank after leaving and returning to a screen.
 * expo-image keeps decoded images in memory and on disk, and draws them
 * without a fade. `preloadImages` warms that cache during the splash.
 */

import { Image, type ImageProps } from 'expo-image';

type Props = Omit<ImageProps, 'contentFit'> & {
  /** RN's name for it, so call sites read the same as before. */
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
};

const FIT = { contain: 'contain', cover: 'cover', stretch: 'fill', center: 'none' } as const;

export function AppImage({ resizeMode = 'cover', ...props }: Props) {
  return <Image cachePolicy="memory-disk" transition={0} {...props} contentFit={FIT[resizeMode]} />;
}
