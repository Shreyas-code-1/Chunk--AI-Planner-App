import { Image } from 'react-native';

// Trimmed from the repo-root "Chunk Log Currency .png" (1254x1254) to 48/96/144px.
const source = require('../../../assets/icons/log.png');

export function LogIcon({ size = 22 }: { size?: number }) {
  return <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />;
}
