import { SessionOrigin } from '@prisma/client';
import { isSessionRestricted } from './session-restriction';

const base = {
  origin: SessionOrigin.purl,
  placeholderEmail: false,
  readerOnly: true,
  emailConfirmedAt: null,
};

describe('isSessionRestricted', () => {
  it('restricts a login-code session that confirmed no address', () => {
    expect(isSessionRestricted(base)).toBe(true);
  });

  it('frees a login-code session once it confirmed an address itself', () => {
    expect(isSessionRestricted({ ...base, emailConfirmedAt: new Date() })).toBe(
      false
    );
  });

  it.each([SessionOrigin.password, SessionOrigin.jwt])(
    'does not restrict a %s session',
    origin => {
      expect(isSessionRestricted({ ...base, origin })).toBe(false);
    }
  );

  it('restricts any reader session while the address is a placeholder', () => {
    expect(
      isSessionRestricted({
        ...base,
        origin: SessionOrigin.password,
        placeholderEmail: true,
        emailConfirmedAt: new Date(),
      })
    ).toBe(true);
  });

  it('leaves staff with a placeholder address unrestricted', () => {
    expect(
      isSessionRestricted({
        ...base,
        origin: SessionOrigin.password,
        placeholderEmail: true,
        readerOnly: false,
      })
    ).toBe(false);
  });

  it('never restricts an impersonation session', () => {
    expect(
      isSessionRestricted({
        ...base,
        origin: SessionOrigin.impersonation,
        placeholderEmail: true,
      })
    ).toBe(false);
  });
});
