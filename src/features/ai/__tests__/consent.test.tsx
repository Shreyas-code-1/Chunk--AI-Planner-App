import React from 'react';
import { AiConsentSync } from '../AiConsentSync';
import { useAiConsent } from '../consent';
import { recordAiConsent } from '../../../api';
import { useSession } from '../../auth/SessionProvider';
const { act, create } = require('react-test-renderer');

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));
jest.mock('../../../api', () => ({ recordAiConsent: jest.fn(async () => {}) }));
jest.mock('../../auth/SessionProvider', () => ({ useSession: jest.fn() }));

const signedIn = (yes: boolean) =>
  jest.mocked(useSession).mockReturnValue({ session: yes ? { user: { id: 'u' } } : null } as ReturnType<typeof useSession>);

const trees: any[] = [];
const mount = async () => { await act(async () => { trees.push(create(<AiConsentSync />)); }); };
afterEach(() => { act(() => trees.splice(0).forEach((t) => t.unmount())); });

beforeEach(() => {
  jest.clearAllMocks();
  useAiConsent.setState({ choice: null, pending: null });
});

test('the latest choice before sign-in wins, with the time it was tapped', () => {
  useAiConsent.getState().choose(true, new Date('2026-09-29T10:00:00Z'));
  useAiConsent.getState().choose(false, new Date('2026-09-29T10:01:00Z'));
  expect(useAiConsent.getState().pending).toEqual({ granted: false, decidedAt: '2026-09-29T10:01:00.000Z' });
});

test('nothing is written without a session', async () => {
  signedIn(false);
  useAiConsent.getState().choose(true);
  await mount();
  expect(recordAiConsent).not.toHaveBeenCalled();
});

test('with a session, the pending choice is written once, then cleared', async () => {
  useAiConsent.getState().choose(true, new Date('2026-09-29T10:00:00Z'));
  signedIn(true);
  await mount();
  expect(recordAiConsent).toHaveBeenCalledTimes(1);
  expect(recordAiConsent).toHaveBeenCalledWith(true, '2026-09-29T10:00:00.000Z');
  expect(useAiConsent.getState().pending).toBeNull();
  expect(useAiConsent.getState().choice?.granted).toBe(true);
});

test('a newer choice made during a write stays pending', () => {
  useAiConsent.getState().choose(true, new Date('2026-09-29T10:00:00Z'));
  useAiConsent.getState().choose(false, new Date('2026-09-29T10:02:00Z'));
  useAiConsent.getState().markSynced('2026-09-29T10:00:00.000Z');
  expect(useAiConsent.getState().pending?.granted).toBe(false);
});

test('a failed write stays pending for the next attempt', async () => {
  jest.mocked(recordAiConsent).mockRejectedValueOnce(new Error('offline'));
  signedIn(true);
  useAiConsent.getState().choose(true);
  await mount();
  expect(recordAiConsent).toHaveBeenCalledTimes(1);
  expect(useAiConsent.getState().pending).not.toBeNull();
});
