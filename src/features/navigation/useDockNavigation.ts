/**
 * Where each dock tab goes. The board draws 3.1 on Home, 3.2 on Today, 5.1 on
 * Focus and 5.2 on You, so the Focus tab opens PROGRESS, not a timer.
 */

import { useCallback } from 'react';
import { usePathname, useRouter } from 'expo-router';

import type { DockTab } from '../../components/ui';

const ROUTES = {
  home: '/home',
  week: '/today',
  focus: '/progress',
  profile: '/you',
} as const;

export function useDockNavigation(active: DockTab | undefined) {
  const router = useRouter();
  const pathname = usePathname();
  const onSelect = useCallback(
    (tab: DockTab) => {
      // By route, not tab: All Work sits under Home, and Home must still go home.
      if (ROUTES[tab] !== pathname) router.replace(ROUTES[tab]);
    },
    [pathname, router],
  );
  const onAdd = useCallback(() => router.push('/add'), [router]);
  return { onSelect, onAdd };
}
