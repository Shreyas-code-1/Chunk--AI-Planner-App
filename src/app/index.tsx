/** Startup route gate. The native splash covers session restoration. */
import { startDestination } from '../features/startup/startDestination';
import { useDraft } from '../features/onboarding/draft';
import { Redirect } from 'expo-router';
import { useSession } from '../features/auth/SessionProvider';

export default function Startup() {
  const draft = useDraft();
  const { loading, session } = useSession();
  if (loading) return null;
  return <Redirect href={startDestination(draft, !!session)} />;
}
