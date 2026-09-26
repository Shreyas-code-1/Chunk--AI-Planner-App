import React from 'react';
import Login from '../../../app/(onboarding)/login';
import { useSession } from '../SessionProvider';
const { act, create } = require('react-test-renderer');
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockRouter = { replace: mockReplace, push: mockPush, back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('../SessionProvider', () => ({ useSession: jest.fn() }));
jest.mock('../../../lib/haptics', () => ({ haptic: jest.fn() }));
const google = jest.fn();
const apple = jest.fn();
let tree: any;
function state(status = 'signed-out', session: any = null) {
  jest.mocked(useSession).mockReturnValue({ status, session, signInWithGoogle: google, signInWithApple: apple } as any);
}
const button = (text: string) => tree.root.findAll((node: any) =>
  typeof node.props.onPress === 'function' &&
  node.findAll((child: any) => child.props.children === text).length > 0
)[0];
beforeEach(() => { jest.resetAllMocks(); state(); act(() => { tree = create(<Login />); }); });
afterEach(() => act(() => tree.unmount()));
test('Google button invokes auth but only authenticated session navigates home', async () => {
  await act(async () => button('CONTINUE WITH GOOGLE').props.onPress());
  expect(google).toHaveBeenCalledTimes(1);
  expect(mockReplace).not.toHaveBeenCalled();
  state('authenticated', { user: { id: 'test-user' } });
  act(() => tree.update(<Login />));
  expect(mockReplace).toHaveBeenCalledWith('/home');
});
test('cancellation stays on login without displaying an error', async () => {
  google.mockResolvedValue(undefined);
  await act(async () => button('CONTINUE WITH GOOGLE').props.onPress());
  expect(mockReplace).not.toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).not.toContain('could not be completed');
});
test('auth failure displays friendly error and can retry', async () => {
  google.mockRejectedValueOnce(new Error('Google sign-in could not be completed. Please try again.'));
  await act(async () => button('CONTINUE WITH GOOGLE').props.onPress());
  expect(JSON.stringify(tree.toJSON())).toContain('Google sign-in could not be completed');
  expect(mockReplace).not.toHaveBeenCalled();
  await act(async () => button('CONTINUE WITH GOOGLE').props.onPress());
  expect(JSON.stringify(tree.toJSON())).not.toContain('Google sign-in could not be completed');
});
test('Email navigation and Apple call remain unchanged', async () => {
  await act(async () => button('CONTINUE WITH EMAIL').props.onPress());
  expect(mockPush).toHaveBeenCalledWith('/email');
  await act(async () => button('CONTINUE WITH APPLE').props.onPress());
  expect(apple).toHaveBeenCalledTimes(1);
});

test('Apple button waits for the authenticated session before navigating home', async () => {
  await act(async () => button('CONTINUE WITH APPLE').props.onPress());
  expect(apple).toHaveBeenCalledTimes(1);
  expect(mockReplace).not.toHaveBeenCalled();
  state('authenticated', { user: { id: 'apple-test-user' } });
  act(() => tree.update(<Login />));
  expect(mockReplace).toHaveBeenCalledWith('/home');
});

test('Apple cancellation stays on login without an error', async () => {
  apple.mockResolvedValue(undefined);
  await act(async () => button('CONTINUE WITH APPLE').props.onPress());
  expect(mockReplace).not.toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).not.toContain('could not be completed');
});

test('Apple failure displays sanitized error and retry clears it', async () => {
  apple.mockRejectedValueOnce(new Error('Apple sign-in could not be completed. Please try again.'));
  await act(async () => button('CONTINUE WITH APPLE').props.onPress());
  expect(JSON.stringify(tree.toJSON())).toContain('Apple sign-in could not be completed');
  expect(mockReplace).not.toHaveBeenCalled();
  await act(async () => button('CONTINUE WITH APPLE').props.onPress());
  expect(JSON.stringify(tree.toJSON())).not.toContain('Apple sign-in could not be completed');
});
