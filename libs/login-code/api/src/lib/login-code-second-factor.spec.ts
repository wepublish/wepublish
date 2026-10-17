import {
  hasSecondFactor,
  LoginCodeSecondFactor,
  maskSecondFactor,
  matchesSecondFactor,
  normalizeSecondFactorAnswer,
  parseLoginCodeSecondFactor,
} from './login-code-second-factor';

const user = {
  firstName: 'Anna-Lise',
  name: 'Müller',
  address: { zipCode: 'CH-8000', city: 'Zürich' },
};

describe('login code second factor', () => {
  it('parses unknown setting values as none', () => {
    expect(parseLoginCodeSecondFactor('postalCode')).toBe(
      LoginCodeSecondFactor.postalCode
    );
    expect(parseLoginCodeSecondFactor('zip')).toBe(LoginCodeSecondFactor.none);
    expect(parseLoginCodeSecondFactor(undefined)).toBe(
      LoginCodeSecondFactor.none
    );
  });

  it('normalizes case, whitespace, punctuation and diacritics', () => {
    expect(normalizeSecondFactorAnswer(' Zü-rich ')).toBe('zurich');
    expect(normalizeSecondFactorAnswer(null)).toBe('');
  });

  it('matches names regardless of case and diacritics', () => {
    expect(
      matchesSecondFactor(LoginCodeSecondFactor.lastName, user, 'MULLER')
    ).toBe(true);
    expect(
      matchesSecondFactor(LoginCodeSecondFactor.lastName, user, 'müller ')
    ).toBe(true);
    expect(
      matchesSecondFactor(LoginCodeSecondFactor.lastName, user, 'Mueller')
    ).toBe(false);
    expect(
      matchesSecondFactor(LoginCodeSecondFactor.firstName, user, 'anna lise')
    ).toBe(true);
    expect(
      matchesSecondFactor(LoginCodeSecondFactor.city, user, 'zurich')
    ).toBe(true);
  });

  it('matches postal codes with or without a country prefix', () => {
    expect(
      matchesSecondFactor(LoginCodeSecondFactor.postalCode, user, '8000')
    ).toBe(true);
    expect(
      matchesSecondFactor(LoginCodeSecondFactor.postalCode, user, 'ch 8000')
    ).toBe(true);
    expect(
      matchesSecondFactor(LoginCodeSecondFactor.postalCode, user, '8001')
    ).toBe(false);
    expect(
      matchesSecondFactor(LoginCodeSecondFactor.postalCode, user, '800')
    ).toBe(false);
  });

  it('never matches an empty answer or a missing attribute', () => {
    expect(
      matchesSecondFactor(
        LoginCodeSecondFactor.postalCode,
        { address: null },
        '8000'
      )
    ).toBe(false);
    expect(matchesSecondFactor(LoginCodeSecondFactor.postalCode, {}, '')).toBe(
      false
    );
    expect(matchesSecondFactor(LoginCodeSecondFactor.firstName, user, '')).toBe(
      false
    );
    expect(
      matchesSecondFactor(LoginCodeSecondFactor.firstName, user, undefined)
    ).toBe(false);
  });

  it('always matches when no factor is configured', () => {
    expect(matchesSecondFactor(LoginCodeSecondFactor.none, {}, undefined)).toBe(
      true
    );
  });

  it('reports whether the user record can satisfy the factor', () => {
    expect(hasSecondFactor(LoginCodeSecondFactor.none, {})).toBe(true);
    expect(hasSecondFactor(LoginCodeSecondFactor.postalCode, user)).toBe(true);
    expect(
      hasSecondFactor(LoginCodeSecondFactor.city, { address: { city: ' ' } })
    ).toBe(false);
    expect(
      hasSecondFactor(LoginCodeSecondFactor.firstName, { firstName: null })
    ).toBe(false);
  });

  it('masks only the configured attribute', () => {
    const masked = maskSecondFactor(LoginCodeSecondFactor.postalCode, user);

    expect(masked.address).toEqual({ zipCode: null, city: 'Zürich' });
    expect(masked.name).toBe('Müller');
    expect(user.address.zipCode).toBe('CH-8000');

    expect(
      maskSecondFactor(LoginCodeSecondFactor.city, user).address?.city
    ).toBeNull();
    expect(
      maskSecondFactor(LoginCodeSecondFactor.firstName, user).firstName
    ).toBeNull();
    expect(maskSecondFactor(LoginCodeSecondFactor.lastName, user).name).toBe(
      ''
    );
    expect(maskSecondFactor(LoginCodeSecondFactor.none, user)).toBe(user);
    expect(
      maskSecondFactor(LoginCodeSecondFactor.postalCode, { address: null })
        .address
    ).toBeNull();
  });
});
