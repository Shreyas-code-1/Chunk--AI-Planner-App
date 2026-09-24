import React from 'react';
import Verify from '../../../app/(onboarding)/verify';
import { Button } from '../../../components/ui';
import { verifyEmailOtp, type VerifyEmailOtpResult } from '../verifyEmailOtp';
const { act, create } = require('react-test-renderer');
const mockReplace = jest.fn();
let mockEmail: unknown;
let mockBlur: (() => void) | undefined;
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: jest.fn() }),
  useLocalSearchParams: () => ({ email: mockEmail }),
  useFocusEffect: (effect: () => (() => void)) => {
    require('react').useEffect(() => { mockBlur = effect(); return mockBlur; }, [effect]);
  },
}));
jest.mock('../verifyEmailOtp', () => ({ verifyEmailOtp: jest.fn() }));
jest.mock('../../../lib/haptics', () => ({ haptic: jest.fn() }));
jest.mock('../../../components/ui', () => ({
  Button: ({ label, ...props }: any) => {
    const { Pressable, Text } = require('react-native');
    return <Pressable {...props}><Text>{label}</Text></Pressable>;
  },
}));
let tree: any;
const input = () => tree.root.findAll((n: any) => n.props.accessibilityLabel === 'Six-digit code' && n.props.onChangeText)[0];
const button = () => tree.root.findByType(Button);
const content = () => JSON.stringify(tree.toJSON());
function edit(code: string) { act(() => input().props.onChangeText(code)); }
async function submit() { await act(async () => { await button().props.onPress(); }); }
beforeEach(() => {
  jest.resetAllMocks();
  mockEmail = ' person@example.com ';
  jest.mocked(verifyEmailOtp).mockResolvedValue({ status: 'verified' });
  act(() => { tree = create(<Verify />); });
});
afterEach(() => act(() => tree.unmount()));

test('six digits alone do not navigate; only verified result does', async () => {
  edit('012345');
  expect(mockReplace).not.toHaveBeenCalled();
  await submit();
  expect(verifyEmailOtp).toHaveBeenCalledWith('person@example.com', '012345');
  expect(mockReplace).toHaveBeenCalledWith('/home');
});

test.each<VerifyEmailOtpResult>([
  { status: 'invalid-or-expired' },
  { status: 'invalid-input', field: 'otp' },
  { status: 'invalid-input', field: 'email' },
  { status: 'failed', reason: 'verification' },
  { status: 'failed', reason: 'configuration' },
  { status: 'failed', reason: 'missing-session' },
])('non-verified result never navigates: %j', async (result) => {
  jest.mocked(verifyEmailOtp).mockResolvedValueOnce(result);
  edit('123456');
  await submit();
  expect(mockReplace).not.toHaveBeenCalled();
  expect(content()).toContain(result.status === 'invalid-or-expired' ? 'That code is invalid or has expired.'
    : result.status === 'invalid-input' ? result.field === 'otp' ? 'Enter all six digits.' : 'Go back and enter a valid email'
    : 'We couldn’t verify your code. Please try again.');
});

test.each(['', '123', 'abc123'])('incomplete/malformed input is not verified %#', async code => {
  edit(code);
  await submit();
  expect(verifyEmailOtp).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
  expect(content()).toContain('Enter all six digits.');
});

test.each([undefined, '', 'invalid', ['person@example.com']])('missing/invalid email fails safely %#', async email => {
  mockEmail = email;
  act(() => tree.update(<Verify />));
  edit('123456');
  await submit();
  expect(button().props.disabled).toBe(true);
  expect(verifyEmailOtp).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
});

test('loading blocks repeated button and keyboard submissions', async () => {
  let finish!: (result: VerifyEmailOtpResult) => void;
  jest.mocked(verifyEmailOtp).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  edit('123456');
  const press = button().props.onPress;
  const keyboard = input().props.onSubmitEditing;
  let pending!: Promise<void>;
  act(() => { pending = press(); void press(); void keyboard(); });
  expect(verifyEmailOtp).toHaveBeenCalledTimes(1);
  expect(button().props.label).toBe('VERIFYING…');
  expect(button().props.disabled).toBe(true);
  expect(input().props.editable).toBe(false);
  expect(mockReplace).not.toHaveBeenCalled();
  await submit();
  expect(verifyEmailOtp).toHaveBeenCalledTimes(1);
  await act(async () => { finish({ status: 'verified' }); await pending; });
  expect(mockReplace).toHaveBeenCalledTimes(1);
});

test('editing clears errors and failed verification can be retried', async () => {
  jest.mocked(verifyEmailOtp).mockResolvedValueOnce({ status: 'invalid-or-expired' });
  edit('123456');
  await submit();
  edit('654321');
  expect(content()).not.toContain('That code is invalid');
  await submit();
  expect(mockReplace).toHaveBeenCalledTimes(1);
});

test('unexpected errors are sanitized and retry clears stale errors', async () => {
  jest.mocked(verifyEmailOtp).mockRejectedValueOnce(new Error('private credentials'));
  edit('123456');
  await submit();
  expect(content()).not.toContain('private credentials');
  expect(content()).toContain('We couldn’t verify your code.');
  expect(mockReplace).not.toHaveBeenCalled();
  await submit();
  expect(content()).not.toContain('We couldn’t verify your code.');
  expect(mockReplace).toHaveBeenCalledTimes(1);
});

test('late verified result after leaving does not navigate', async () => {
  let finish!: (result: VerifyEmailOtpResult) => void;
  jest.mocked(verifyEmailOtp).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  edit('123456');
  let pending!: Promise<void>;
  act(() => { pending = button().props.onPress(); });
  act(() => mockBlur?.());
  await act(async () => { finish({ status: 'verified' }); await pending; });
  expect(mockReplace).not.toHaveBeenCalled();
});

test('resend remains visible without pretending to send a code', () => {
  const resend = tree.root.findAll((n: any) => n.props.onPress &&
    n.findAll((child: any) => child.props.children === 'Resend code').length > 0)[0];
  act(() => resend.props.onPress());
  expect(content()).toContain('To request another code, go back to the email screen.');
  expect(verifyEmailOtp).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
});
