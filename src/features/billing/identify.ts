import { identityCoordinator } from './identityCoordinator';

export type IdentifyCustomerResult =
  | { status: 'identified'; isPro: boolean }
  | { status: 'superseded' }
  | { status: 'failed'; reason: 'invalid-user-id' | 'in-progress' | 'initialization' | 'login' };

// This operation accepts Supabase user UUIDs, not emails or arbitrary customer labels.
const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Pass session.user.id unchanged. A repeated call after failure is an explicit retry. */
export async function identifyCustomer(appUserId: string): Promise<IdentifyCustomerResult> {
  if (typeof appUserId !== 'string' || !USER_ID.test(appUserId) ||
      appUserId === '00000000-0000-0000-0000-000000000000') {
    return { status: 'failed', reason: 'invalid-user-id' };
  }
  try {
    let requested = identityCoordinator.setDesiredIdentity({ kind: 'identified', userId: appUserId });
    if (requested.status === 'failed') requested = identityCoordinator.retry();
    const result = await identityCoordinator.waitForGeneration(requested.generation);
    // A ready waiter may have resolved just before another request changed identity.
    const current = identityCoordinator.getSnapshot();
    if (result.status === 'superseded' || current.generation !== requested.generation ||
        current.desired.kind !== 'identified' || current.desired.userId !== appUserId) {
      return { status: 'superseded' };
    }
    if (result.status === 'ready' && current.status === 'ready' && result.isPro !== null) {
      return { status: 'identified', isPro: result.isPro };
    }
    return { status: 'failed', reason: result.status === 'failed' && result.reason === 'initialization'
      ? 'initialization' : 'login' };
  } catch {
    return { status: 'failed', reason: 'login' };
  }
}
