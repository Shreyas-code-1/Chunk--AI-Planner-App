import { isRealClass } from '../classNames';

describe('isRealClass', () => {
  it.each(['Biology', 'AP Chem', 'Honors English 10', 'Algebra II', 'US History', 'PE', 'Intro to Psych', 'Spanish 3'])(
    'accepts %s',
    (name) => expect(isRealClass(name)).toBe(true),
  );

  it.each(['asdf', 'lol', 'bus', '12345', 'my stuff', ''])('rejects %s', (name) =>
    expect(isRealClass(name)).toBe(false),
  );
});
