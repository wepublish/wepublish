import { LoginCodeSecondFactor } from '@wepublish/login-code/api';
import { SessionResolver } from './session.resolver';

const currentSessionWith = (
  placeholderEmail: boolean,
  secondFactor: LoginCodeSecondFactor
) =>
  new SessionResolver(
    {} as never,
    { getFactor: vi.fn().mockResolvedValue(secondFactor) } as never
  ).currentSession({
    origin: 'purl',
    restricted: true,
    placeholderEmail,
    createdAt: new Date('2026-10-11T08:00:00.000Z'),
    expiresAt: new Date('2026-11-11T08:00:00.000Z'),
  } as never);

describe('SessionResolver currentSession', () => {
  it.each([
    [
      'a real address guarded by a second factor',
      false,
      LoginCodeSecondFactor.postalCode,
      true,
    ],
    ['a placeholder address', true, LoginCodeSecondFactor.none, true],
    [
      'a real address without a second factor',
      false,
      LoginCodeSecondFactor.none,
      false,
    ],
  ])(
    'tells the website whether %s may be replaced',
    async (_label, placeholderEmail, secondFactor, canReplace) => {
      const info = await currentSessionWith(placeholderEmail, secondFactor);

      expect(info.canReplaceEmail).toBe(canReplace);
    }
  );
});
