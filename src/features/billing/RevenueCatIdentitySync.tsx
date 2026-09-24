import { useEffect } from 'react';

import { useSession } from '../auth/SessionProvider';
import { identifyCustomer } from './identify';

// Shared across bridge remounts so a previous SDK call finishes before the next.
let identificationQueue: Promise<void> = Promise.resolve();

/** Identity only. Does not publish entitlement state, mutate auth, or log out. */
export function RevenueCatIdentitySync() {
  const { session, loading, configError } = useSession();
  const userId = !loading && !configError && session?.access_token && !session.user.is_anonymous
    ? session.user.id : null;

  useEffect(() => {
    if (!userId) return;
    let current = true;
    identificationQueue = identificationQueue.then(async () => {
      if (!current) return;
      try {
        // Initialization and UUID validation are owned by the tested operation.
        // An already-started SDK call cannot be cancelled. The latest session's
        // queued call runs afterward; no stale result is stored or published.
        await identifyCustomer(userId);
      } catch {
        // Keep unexpected failures isolated from Supabase and later queue entries.
      }
    });
    return () => { current = false; };
    // Depend only on the eligible ID: token refreshes must not trigger logIn.
  }, [userId]);

  return null;
}
