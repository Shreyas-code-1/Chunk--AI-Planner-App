import type { Href } from 'expo-router';
type BackRouter = { canGoBack(): boolean; back(): void; replace(route: Href): void };
export function safeBack(router: BackRouter, fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
export const QUESTION_ROUTES = ['/goals','/profile','/classes','/study-style','/week','/when-you-start','/what-goes-wrong','/daily-pace','/vs-alone','/progress-curve'] as const;
export function backDestination(pathname: string): Href {
  const index = QUESTION_ROUTES.indexOf(pathname as typeof QUESTION_ROUTES[number]);
  if (index >= 0) return index === 0 ? '/ai-consent' : QUESTION_ROUTES[index - 1];
  const fallback: Record<string, Href> = { '/verify':'/email', '/email':'/login', '/login':'/welcome', '/paywall':'/progress-curve', '/progress-curve':'/vs-alone', '/vs-alone':'/daily-pace', '/ai-consent':'/welcome', '/settings':'/you', '/focus':'/today', '/chunk-failed':'/add' };
  return fallback[pathname] ?? '/home';
}
export function handleAndroidBack(router: BackRouter, pathname: string): boolean {
  // Let the navigator handle a valid stack, and let Android exit from root Home/Welcome.
  if (router.canGoBack() || pathname === '/home' || pathname === '/welcome' || pathname === '/') return false;
  router.replace(backDestination(pathname)); return true;
}
