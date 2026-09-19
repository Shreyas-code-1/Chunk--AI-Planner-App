/**
 * Temporary dev entry point.
 *
 * Screen 2.1 SPLASH belongs here. Until it is built, this route sends you
 * straight to the primitives gallery so the foundation can be checked on a
 * device. Both this redirect and src/app/gallery.tsx are deleted when the real
 * splash arrives.
 */

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/gallery" />;
}
