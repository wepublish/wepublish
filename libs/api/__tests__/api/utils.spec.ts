import { isMeBySession } from 'libs/api/src/lib/graphql/utils';
import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';

describe('utils', () => {
  test('isMeBySession returns true if userId matches session', () => {
    const today = new Date();
    const future = new Date(today);
    future.setDate(future.getDate() + 5000);

    const mockId = '123';
    const mockSession = {
      type: AuthSessionType.User,
      expiresAt: future,
      user: {
        id: '123',
      },
    } as AuthSession;

    expect(isMeBySession(mockId, mockSession)).toEqual(true);
  });

  test("isMeBySession returns false if userId doesn't match session", () => {
    const today = new Date();
    const future = new Date(today);
    future.setDate(future.getDate() + 5000);

    const mockId = '123';
    const mockSession = {
      type: AuthSessionType.User,
      expiresAt: future,
      user: {
        id: 'incorrect id',
      },
    } as AuthSession;

    expect(isMeBySession(mockId, mockSession)).toEqual(false);
  });
});
