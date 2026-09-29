/** Startup route gate. The native splash covers session restoration. */
import { Redirect } from 'expo-router';
import { useSession } from '../features/auth/SessionProvider';

export default function Startup() {
  const { status, session } = useSession();
  if (status === 'unresolved') return null;
  // Configuration/restoration errors may show onboarding, but never grant access.
  return <Redirect href={status === 'authenticated' && session ? '/home' : '/welcome'} />;
}
