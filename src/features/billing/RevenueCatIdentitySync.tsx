import { useEffect } from 'react';
import { useSession } from '../auth/SessionProvider';
import { identityCoordinator } from './identityCoordinator';

/** Identity only. Does not publish entitlement state, mutate auth, or log out. */
export function RevenueCatIdentitySync() {
  const { session, loading, configError } = useSession();
  const userId = !loading && !configError && session?.access_token && !session.user.is_anonymous
    ? session.user.id : null;

  useEffect(() => {
    // Anonymous would introduce logout. Unresolved invalidates readiness while
    // leaving the SDK customer untouched until the later logout phase.
    identityCoordinator.setDesiredIdentity(userId
      ? { kind: 'identified', userId }
      : { kind: 'unresolved' });
    return () => { identityCoordinator.setDesiredIdentity({ kind: 'unresolved' }); };
  }, [userId]);

  return null;
}
