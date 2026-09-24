import { useEffect } from 'react';
import { useSession } from '../auth/SessionProvider';
import { identityCoordinator } from './identityCoordinator';

/** Maps resolved auth state; the coordinator owns all SDK identity transitions. */
export function RevenueCatIdentitySync() {
  const { session, status } = useSession();
  const userId = status === 'authenticated' && !session?.user.is_anonymous
    ? session?.user.id : undefined;
  const kind = status === 'signed-out' ? 'anonymous' : userId ? 'identified' : 'unresolved';

  useEffect(() => {
    identityCoordinator.setDesiredIdentity(kind === 'identified' && userId
      ? { kind: 'identified', userId }
      : { kind: kind === 'anonymous' ? 'anonymous' : 'unresolved' });
    return () => { identityCoordinator.setDesiredIdentity({ kind: 'unresolved' }); };
  }, [kind, userId]);

  return null;
}
