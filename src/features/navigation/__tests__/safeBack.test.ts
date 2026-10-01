import { safeBack, handleAndroidBack, backDestination } from '../safeBack';
const makeRouter = (history = false) => ({ canGoBack: () => history, back: jest.fn(), replace: jest.fn() });
test('Back uses actual history when it exists', () => { const r=makeRouter(true); safeBack(r,'/home'); expect(r.back).toHaveBeenCalledTimes(1); expect(r.replace).not.toHaveBeenCalled(); });
test.each(['/add','/focus','/today','/settings','/paywall','/email','/verify'])('direct/restored %s never dispatches invalid GO_BACK', route => { const r=makeRouter(); safeBack(r,backDestination(route)); expect(r.back).not.toHaveBeenCalled(); expect(r.replace).toHaveBeenCalledWith(backDestination(route)); });
test('Android system Back defers to valid navigation history', () => { const r=makeRouter(true); expect(handleAndroidBack(r,'/add')).toBe(false); expect(r.replace).not.toHaveBeenCalled(); });
test.each(['/home','/welcome'])('Android root %s exits normally without GO_BACK', route => { const r=makeRouter(); expect(handleAndroidBack(r,route)).toBe(false); expect(r.back).not.toHaveBeenCalled(); expect(r.replace).not.toHaveBeenCalled(); });
test('Android direct Settings safely returns to Profile', () => { const r=makeRouter(); expect(handleAndroidBack(r,'/settings')).toBe(true); expect(r.replace).toHaveBeenCalledWith('/you'); });
test.each([['/verify','/email'],['/email','/login'],['/classes','/profile'],['/focus','/today']])('fallback for %s is %s', (route,destination) => expect(backDestination(route)).toBe(destination));
