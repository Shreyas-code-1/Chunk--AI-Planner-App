import { startDestination } from '../startDestination';
import { useDraft } from '../../onboarding/draft';
beforeEach(() => useDraft.getState().reset());
test('clean install or cleared storage starts Welcome', () => expect(startDestination(useDraft.getState(),false)).toBe('/welcome'));
test('partial onboarding resumes its semantic progress', () => { useDraft.getState().setStep('/classes'); expect(startDestination(useDraft.getState(),false)).toBe('/classes'); });
test.each([false,true])('completed user starts Home (authenticated=%s)', signedIn => { useDraft.getState().complete(); expect(startDestination(useDraft.getState(),signedIn)).toBe('/home'); });
test.each(['/add','/focus','/today','/settings','/paywall','/email','/verify','/you'])('previous %s cannot reopen for a completed user', route => { useDraft.getState().complete(); useDraft.getState().setStep('/paywall'); expect(useDraft.getState().lastStep).toBeNull(); expect(startDestination(useDraft.getState(),false)).toBe('/home'); });

test('authenticated but unfinished onboarding still resumes its saved step', () => { useDraft.getState().setStep('/classes'); expect(startDestination(useDraft.getState(),true)).toBe('/classes'); });
