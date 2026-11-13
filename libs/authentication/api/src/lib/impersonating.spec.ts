import { AuthSessionType } from './auth-session';
import { ImpersonatingError, assertNotImpersonating } from './impersonating';

describe('assertNotImpersonating', () => {
  it('lets an ordinary session through', () => {
    expect(() =>
      assertNotImpersonating({
        type: AuthSessionType.User,
        impersonatedBy: null,
      } as never)
    ).not.toThrow();
    expect(() => assertNotImpersonating(null)).not.toThrow();
  });

  it('refuses a session someone opened as this user', () => {
    expect(() =>
      assertNotImpersonating({
        type: AuthSessionType.User,
        impersonatedBy: 'jane@wepublish.ch',
      } as never)
    ).toThrow(ImpersonatingError);
  });
});
