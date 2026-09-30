/** Startup route gate. The native splash covers session restoration. */
import { Redirect } from 'expo-router';
import { useSession } from '../features/auth/SessionProvider';

export default function Startup() {
  const { loading, session } = useSession();
  if (loading) return null;
  return <Redirect href={session ? '/home' : '/welcome'} />;
}
