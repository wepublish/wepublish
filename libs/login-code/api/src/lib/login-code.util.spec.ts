import {
  buildPurl,
  deriveLoginCodeKey,
  formatLoginCode,
  generateLoginCode,
  hashLoginCode,
  LOGIN_CODE_ALPHABET,
  normalizeLoginCode,
} from './login-code.util';

describe('login-code util', () => {
  it('generates ten symbols from the unambiguous alphabet', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateLoginCode();

      expect(code).toHaveLength(10);
      expect([...code].every(char => LOGIN_CODE_ALPHABET.includes(char))).toBe(
        true
      );
      expect(code).not.toMatch(/[ILOU]/);
    }
  });

  it('normalizes typed input: case, separators and look-alikes', () => {
    expect(normalizeLoginCode('abcde-fghjk')).toBe('ABCDEFGHJK');
    expect(normalizeLoginCode(' abc de.fgh jk ')).toBe('ABCDEFGHJK');
    expect(normalizeLoginCode('0O1I1LABCD')).toBe(
      '0011 11ABCD'.replace(' ', '')
    );
    expect(normalizeLoginCode('ABCDE')).toBeNull();
    expect(normalizeLoginCode('ABCDE-FGHJK-X')).toBeNull();
  });

  it('formats a canonical code in two groups', () => {
    expect(formatLoginCode('ABCDEFGHJK')).toBe('ABCDE-FGHJK');
  });

  it('hashes deterministically and key-dependently', () => {
    const keyA = deriveLoginCodeKey('secret-key-aaaaaaaaaa');
    const keyB = deriveLoginCodeKey('secret-key-bbbbbbbbbb');

    expect(hashLoginCode('ABCDEFGHJK', keyA)).toBe(
      hashLoginCode('ABCDEFGHJK', keyA)
    );
    expect(hashLoginCode('ABCDEFGHJK', keyA)).not.toBe(
      hashLoginCode('ABCDEFGHJK', keyB)
    );
    expect(hashLoginCode('ABCDEFGHJK', keyA)).not.toBe(
      hashLoginCode('ABCDEFGHJX', keyA)
    );
  });

  it('builds the personal url without a double slash', () => {
    expect(buildPurl('https://example.com/', 'ABCDEFGHJK')).toBe(
      'https://example.com/l/ABCDE-FGHJK'
    );
    expect(buildPurl('https://example.com', 'ABCDEFGHJK')).toBe(
      'https://example.com/l/ABCDE-FGHJK'
    );
  });
});
