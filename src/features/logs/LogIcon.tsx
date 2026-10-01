import { AppImage } from '../../components/ui/AppImage';

// Trimmed from the repo-root "Chunk Log Currency .png" (1254x1254) to 48/96/144px.
export const LOG_ICON: number = require('../../../assets/icons/log.png');

export function LogIcon({ size = 22 }: { size?: number }) {
  return <AppImage source={LOG_ICON} style={{ width: size, height: size }} resizeMode="contain" />;
}
