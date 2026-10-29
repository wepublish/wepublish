import { User, UserAddress } from '@prisma/client';
import {
  canReceiveLetters,
  countryName,
  LetterAddressError,
  normalizeCountry,
  toLetterAddress,
  UserWithAddress,
} from './letter-recipient';

function user(address: Partial<UserAddress> | null): UserWithAddress {
  return {
    id: 'user-1',
    firstName: 'Jane',
    name: 'Doe',
    address:
      address ?
        ({
          createdAt: new Date(),
          modifiedAt: new Date(),
          userId: 'user-1',
          company: null,
          streetAddress: 'Musterstrasse',
          streetAddressNumber: '7',
          streetAddress2: null,
          streetAddress2Number: null,
          zipCode: '8000',
          city: 'Zürich',
          country: 'Schweiz',
          ...address,
        } as UserAddress)
      : null,
  } as unknown as User & { address: UserAddress | null };
}

describe('normalizeCountry', () => {
  it('keeps an alpha-2 code', () => {
    expect(normalizeCountry('ch')).toBe('CH');
    expect(normalizeCountry('DE')).toBe('DE');
  });

  it('maps the country names the address form collects today', () => {
    expect(normalizeCountry('Schweiz')).toBe('CH');
    expect(normalizeCountry('suisse')).toBe('CH');
    expect(normalizeCountry('Deutschland')).toBe('DE');
    expect(normalizeCountry('Österreich')).toBe('AT');
  });

  it('returns null for anything it cannot map', () => {
    expect(normalizeCountry('Absurdistan')).toBeNull();
    expect(normalizeCountry('')).toBeNull();
    expect(normalizeCountry(null)).toBeNull();
  });
});

describe('toLetterAddress', () => {
  it('builds an address from the user and their address', () => {
    expect(toLetterAddress(user({}))).toEqual({
      name: 'Jane Doe',
      street: 'Musterstrasse',
      number: '7',
      zip: '8000',
      city: 'Zürich',
      country: 'CH',
    });
  });

  it('prefers the company over the personal name', () => {
    expect(toLetterAddress(user({ company: 'Verlag AG' })).name).toBe(
      'Verlag AG'
    );
  });

  it('falls back to the second street line', () => {
    const address = toLetterAddress(
      user({
        streetAddress: null,
        streetAddressNumber: null,
        streetAddress2: 'Postfach',
        streetAddress2Number: '12',
      })
    );

    expect(address.street).toBe('Postfach');
    expect(address.number).toBe('12');
  });

  it('truncates to the field lengths the provider accepts', () => {
    const address = toLetterAddress(
      user({
        company: 'A'.repeat(60),
        streetAddress: 'B'.repeat(60),
        city: 'C'.repeat(40),
      })
    );

    expect(address.name).toHaveLength(45);
    expect(address.street).toHaveLength(40);
    expect(address.city).toHaveLength(25);
  });

  it('refuses a user without an address', () => {
    expect(() => toLetterAddress(user(null))).toThrow(LetterAddressError);
  });

  it('refuses an address whose country cannot be mapped', () => {
    expect(() => toLetterAddress(user({ country: 'Absurdistan' }))).toThrow(
      LetterAddressError
    );
  });

  it('refuses an address without a zip code', () => {
    expect(() => toLetterAddress(user({ zipCode: null }))).toThrow(
      LetterAddressError
    );
  });
});

describe('canReceiveLetters', () => {
  it('answers without throwing', () => {
    expect(canReceiveLetters(user({}))).toBe(true);
    expect(canReceiveLetters(user(null))).toBe(false);
  });
});

describe('countryName', () => {
  afterEach(() => vi.restoreAllMocks());

  it('spells out the countries Neue Wege sends to', () => {
    expect(countryName('CH')).toBe('Schweiz');
    expect(countryName('DE')).toBe('Deutschland');
    expect(countryName('AT')).toBe('Österreich');
    expect(countryName('LI')).toBe('Liechtenstein');
  });

  // The api runs as a pkg-built binary whose Node has only reduced ICU data:
  // `Intl.DisplayNames` there knows no region names and echoes the code back,
  // which put «CH» into the address window that Pingen reads.
  it('does not depend on the region names of the running Node', async () => {
    vi.spyOn(Intl, 'DisplayNames').mockImplementation(function () {
      return { of: (code: string) => code } as unknown as Intl.DisplayNames;
    });
    // load the module the way the binary does: with that Intl from the start
    vi.resetModules();
    const fresh = await import('./letter-recipient');

    expect(fresh.countryName('CH')).toBe('Schweiz');
    expect(fresh.countryName('DE')).toBe('Deutschland');
  });

  it('accepts lower case codes', () => {
    expect(countryName('ch')).toBe('Schweiz');
  });

  it('keeps a code it does not know as given rather than dropping it', () => {
    expect(countryName('ZZ')).toBe('ZZ');
  });
});
