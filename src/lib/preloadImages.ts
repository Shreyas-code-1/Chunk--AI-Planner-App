/**
 * Downloads and decodes every bundled image while the splash is up, so no
 * screen draws a blank where the mascot, a dock icon or the log should be.
 */

import { Asset } from 'expo-asset';
import { Image } from 'expo-image';

import { mascot } from '../components/mascot';
import { DOCK_ICON_SOURCES } from '../components/ui/BottomDock';
import { LOG_ICON } from '../features/logs/LogIcon';

export async function preloadImages(): Promise<void> {
  const modules = [...new Set<number>([...Object.values(mascot), ...DOCK_ICON_SOURCES, LOG_ICON])];
  const assets = await Asset.loadAsync(modules);
  const uris = assets.map((a) => a.localUri ?? a.uri).filter(Boolean);
  await Image.prefetch(uris, 'memory-disk');
}
