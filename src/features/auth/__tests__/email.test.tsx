import React from 'react';
import { isOnline } from '../../../lib/network';
jest.mock('../../../lib/network', () => ({ isOnline: jest.fn() }));
import Email from '../../../app/(onboarding)/email';
import { Button, Input } from '../../../components/ui';
import { requestEmailOtp, type RequestEmailOtpResult } from '../requestEmailOtp';

const { act, create } = require('react-test-renderer');
const mockPush = jest.fn();
const mockBack = jest.fn();
let mockBlur: (() => void) | undefined;
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useFocusEffect: (effect: () => (() => void)) => {
    require('react').useEffect(() => { mockBlur = effect(); return mockBlur; }, [effect]);
  },
}));
jest.mock('../requestEmailOtp', () => ({ requestEmailOtp: jest.fn() }));
jest.mock('../../../lib/haptics', () => ({ haptic: jest.fn() }));
// Isolate screen behavior from the shared button's native animation runtime.
jest.mock('../../../components/ui', () => ({
  Button: ({ label, ...props }: any) => {
    const { Pressable, Text } = require('react-native');
    return <Pressable {...props}><Text>{label}</Text></Pressable>;
  },
  Input: (props: any) => {
    const { TextInput } = require('react-native');
    return <TextInput {...props} />;
  },
}));

let tree: any;
const input = () => tree.root.findByType(Input);
const button = () => tree.root.findByType(Button);
const content = () => JSON.stringify(tree.toJSON());
function edit(value: string) { act(() => input().props.onChangeText(value)); }
async function submit() { await act(async () => { await button().props.onPress(); }); }
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(isOnline).mockResolvedValue(true);
  jest.mocked(requestEmailOtp).mockResolvedValue({ status: 'requested' });
  act(() => { tree = create(<Email />); });
});
afterEach(() => { act(() => tree.unmount()); });

test('requests with normalized email and transfers it only after success', async () => {
  edit(' Person+Chunk@example.com ');
  expect(mockPush).not.toHaveBeenCalled();
  await submit();
  expect(requestEmailOtp).toHaveBeenCalledWith('Person+Chunk@example.com');
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/verify', params: { email: 'Person+Chunk@example.com' } });
});

test('invalid email stays on screen and editing clears validation', async () => {
  edit('invalid');
  await submit();
  expect(requestEmailOtp).not.toHaveBeenCalled();
  expect(mockPush).not.toHaveBeenCalled();
  expect(content()).toContain('That does not look like an email address.');
  edit('person@example.com');
  expect(content()).not.toContain('That does not look like an email address.');
});

test.each(['configuration', 'request', 'invalid-email'] as const)('handles %s result without navigation', async (reason) => {
  jest.mocked(requestEmailOtp).mockResolvedValueOnce({ status: 'failed', reason });
  edit('person@example.com');
  await submit();
  expect(mockPush).not.toHaveBeenCalled();
  expect(content()).toContain(reason === 'invalid-email'
    ? 'That does not look like an email address.' : 'We couldn’t send your code. Please try again.');
  expect(button().props.disabled).toBe(false);
});

test('loading blocks button and keyboard duplicate submissions before and after rerender', async () => {
  let finish!: (result: RequestEmailOtpResult) => void;
  jest.mocked(requestEmailOtp).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  edit('person@example.com');
  const press = button().props.onPress;
  const keyboard = input().props.onSubmitEditing;
  let pending!: Promise<void>;
  await act(async () => { pending = press(); void press(); void keyboard(); });
  expect(requestEmailOtp).toHaveBeenCalledTimes(1);
  expect(button().props.label).toBe('SENDING…');
  expect(button().props.disabled).toBe(true);
  expect(input().props.editable).toBe(false);
  expect(mockPush).not.toHaveBeenCalled();
  await submit();
  expect(requestEmailOtp).toHaveBeenCalledTimes(1);
  await act(async () => { finish({ status: 'requested' }); await pending; });
  expect(mockPush).toHaveBeenCalledTimes(1);
});

test('retry clears stale errors while pending and can navigate on success', async () => {
  jest.mocked(requestEmailOtp).mockResolvedValueOnce({ status: 'failed', reason: 'request' });
  edit('person@example.com');
  await submit();
  let finish!: (result: RequestEmailOtpResult) => void;
  jest.mocked(requestEmailOtp).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  let pending!: Promise<void>;
  act(() => { pending = button().props.onPress(); });
  expect(content()).not.toContain('We couldn’t send your code.');
  await act(async () => { finish({ status: 'requested' }); await pending; });
  expect(mockPush).toHaveBeenCalledTimes(1);
});

test('unexpected rejection is sanitized and allows retry', async () => {
  jest.mocked(requestEmailOtp).mockRejectedValueOnce(new Error('private internal details'));
  edit('person@example.com');
  await submit();
  expect(content()).not.toContain('private internal details');
  expect(content()).toContain('We couldn’t send your code. Please try again.');
  expect(mockPush).not.toHaveBeenCalled();
  await submit();
  expect(mockPush).toHaveBeenCalledTimes(1);
});

test('leaving the screen ignores a late successful request', async () => {
  let finish!: (result: RequestEmailOtpResult) => void;
  jest.mocked(requestEmailOtp).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  edit('person@example.com');
  let pending!: Promise<void>;
  await act(async () => { pending = button().props.onPress(); });
  act(() => mockBlur?.());
  await act(async () => { finish({ status: 'requested' }); await pending; });
  expect(mockPush).not.toHaveBeenCalled();
});


test('offline routes to main offline screen without sending an OTP', async () => {
  jest.mocked(isOnline).mockResolvedValueOnce(false);
  edit('person@example.com'); await submit();
  expect(mockPush).toHaveBeenCalledWith('/offline');
  expect(requestEmailOtp).not.toHaveBeenCalled();
});
test('duplicate taps during connectivity check cannot send twice', async () => {
  let finish!: (value: boolean) => void;
  jest.mocked(isOnline).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  edit('person@example.com');
  let pending!: Promise<void>;
  act(() => { pending = button().props.onPress(); void button().props.onPress(); });
  expect(isOnline).toHaveBeenCalledTimes(1);
  expect(requestEmailOtp).not.toHaveBeenCalled();
  await act(async () => { finish(true); await pending; });
  expect(requestEmailOtp).toHaveBeenCalledTimes(1);
});
test('leaving during connectivity check prevents an OTP request', async () => {
  let finish!: (value: boolean) => void;
  jest.mocked(isOnline).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  edit('person@example.com');
  let pending!: Promise<void>;
  act(() => { pending = button().props.onPress(); });
  act(() => mockBlur?.());
  await act(async () => { finish(true); await pending; });
  expect(requestEmailOtp).not.toHaveBeenCalled();
  expect(mockPush).not.toHaveBeenCalled();
});
