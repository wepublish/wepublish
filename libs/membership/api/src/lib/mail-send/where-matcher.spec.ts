import { matches } from './where-matcher';

describe('matches', () => {
  it.each([
    ['an empty OR', { OR: [] }],
    ['an empty AND', { AND: [] }],
    ['an empty filter in an OR', { OR: [{}, { email: 'a@b.ch' }] }],
  ])('rejects %s, which Prisma drops inside a list', (_, where) => {
    expect(() => matches({ email: 'a@b.ch' }, where)).toThrow();
  });

  it('accepts an empty filter in an AND', () => {
    expect(
      matches({ email: 'a@b.ch' }, { AND: [{}, { email: 'a@b.ch' }] })
    ).toBe(true);
  });
});
