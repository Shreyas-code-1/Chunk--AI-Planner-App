import { useEffect } from 'react';

import { recordAiConsent } from '../../api';
import { useSession } from '../auth/SessionProvider';
import { useAiConsent } from './consent';

/**
 * Writes the latest unsaved AI choice once there is a session. A failed write
 * stays pending and is retried on the next session change or launch.
 */
export function AiConsentSync() {
  const { session } = useSession();
  const pending = useAiConsent((s) => s.pending);

  useEffect(() => {
    if (!session || !pending) return;
    recordAiConsent(pending.granted, pending.decidedAt)
      .then(() => useAiConsent.getState().markSynced(pending.decidedAt))
      .catch(() => console.warn('[consent] sync-failed'));
  }, [session, pending]);

  return null;
}
