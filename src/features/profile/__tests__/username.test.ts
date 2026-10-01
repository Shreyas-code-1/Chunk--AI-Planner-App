import { normalizeUsername, useUsername } from '../username';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(() => useUsername.setState({ username: null }));

describe('username', () => {
  it('normalizes what the student types', () => {
    expect(normalizeUsername('  @MayaChen ')).toBe('mayachen');
  });

  it('saves valid names and rejects invalid ones', () => {
    expect(useUsername.getState().setUsername('maya_chen')).toBe(true);
    expect(useUsername.getState().username).toBe('maya_chen');
    for (const bad of ['ab', 'maya chen', 'maya!', 'a'.repeat(21)]) {
      expect(useUsername.getState().setUsername(bad)).toBe(false);
    }
    expect(useUsername.getState().username).toBe('maya_chen');
  });

  it('clears on empty', () => {
    useUsername.getState().setUsername('maya');
    expect(useUsername.getState().setUsername('  ')).toBe(true);
    expect(useUsername.getState().username).toBeNull();
  });
});
